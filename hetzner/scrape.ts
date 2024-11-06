import * as cheerio from 'cheerio';

export interface ServerSpec {
  name: string;
  vcpu: number;
  ram: string;
  storage: string;
  traffic: string;
  hasIPv4: boolean;
  cpuType: string;
  pricing: {
    hourly: {
      [location: string]: {
        ipv4: number;
        ipv6: number;
      };
    };
    monthly: {
      [location: string]: {
        ipv4: number;
        ipv6: number;
      };
    };
  };
}

export const extractServerData = (html: string): ServerSpec[] => {
  const $ = cheerio.load(html);
  const servers: ServerSpec[] = [];

  $('.cputype-toggle').each((_, element) => {
    const $row = $(element);
    
    const name = $row.find('.cloud-table-name').text().trim();
    const vcpu = parseInt($row.find('.cloud-table-item:contains("VCPU")').next().text().trim() || 
                        $row.find('.cloud-table-item').first().next().find('.cloud-table-item').text().trim());
    const ram = $row.find('.cloud-table-item:contains("GB")').first().text().trim();
    const storage = $row.find('.cloud-table-item:contains("GB")').eq(1).text().trim();
    
    const trafficAll = $row.find('.cloud-table-traffic [data-location="ALL"]').text().trim();
    const trafficSG = $row.find('.cloud-table-traffic [data-location="SG"]').text().trim();
    const traffic = trafficSG || trafficAll;

    const hasIPv4 = $row.find('.ip-toggle.ipv4').hasClass('fa-check');

    const pricing = {
      hourly: {} as { [key: string]: { ipv4: number; ipv6: number } },
      monthly: {} as { [key: string]: { ipv4: number; ipv6: number } }
    };
    
    const cpuType = $row.attr('class')!
      .split(' ')[1];

    ['DE', 'US', 'FI', 'SG'].forEach(location => {
      const hourlyPrices = $row.find(`.cloud-table-hourly [data-location="${location}"]`);
      const monthlyPrices = $row.find(`.cloud-table-monthly [data-location="${location}"]`);

      if (hourlyPrices.length > 0) {
        pricing.hourly[location] = {
          ipv4: parseFloat(hourlyPrices.find('.ip-toggle.ipv4').text().trim().replace('€', '').trim()),
          ipv6: parseFloat(hourlyPrices.find('.ip-toggle.ipv6').text().trim().replace('€', '').trim())
        };

        pricing.monthly[location] = {
          ipv4: parseFloat(monthlyPrices.find('.ip-toggle.ipv4').text().trim().replace('€', '').trim()),
          ipv6: parseFloat(monthlyPrices.find('.ip-toggle.ipv6').text().trim().replace('€', '').trim())
        };
      }
    });

    servers.push({
      name,
      vcpu,
      ram,
      storage,
      cpuType,
      traffic,
      hasIPv4,
      pricing
    });
  });

  return servers;
};

const hasLocation = (
  pricing: ServerSpec['pricing']['hourly'], 
  location: string
): boolean => {
  return location in pricing;
};

const getServerPricing = (
  server: ServerSpec, 
  location: string
): { hourly: { ipv4: number; ipv6: number }; monthly: { ipv4: number; ipv6: number } } | null => {
  if (!hasLocation(server.pricing.hourly, location)) {
    return null;
  }
  
  return {
    hourly: server.pricing.hourly[location],
    monthly: server.pricing.monthly[location]
  };
};

export const scrapeHetzner = async (url = 'https://www.hetzner.com/cloud/') => {
  const response = await fetch(url);
  const html = await response.text();
  return extractServerData(html);
};
import { promises as fs } from 'fs';

const saveDataToFile = async (data: any, filePath: string) => {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Data successfully written to ${filePath}`);
  } catch (error) {
    console.error(`Error writing data to file: ${error}`);
  }
};

const res = await scrapeHetzner();
await saveDataToFile(res, 'hetzner/prices.json');
