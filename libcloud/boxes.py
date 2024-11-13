import os

from libcloud.compute.types import Provider
from libcloud.compute.base import Node, NodeSize
from libcloud.compute.providers import get_driver
import libcloud
import configparser
import matplotlib.pyplot as plt
import pandas as pd

# This was used for prelim investigation of NodeSize objects
import jsonpickle
class DriverExclusionHandler(jsonpickle.handlers.BaseHandler):
    def flatten(self, obj, data):
        if "driver" in obj:
            data["driver"] = {
                "name": obj.driver.name,
                "region": obj.driver.region,
            }
        # data = {k: v for k, v in data.items() if k != 'driver'}
        return data

jsonpickle.handlers.registry.register(object, DriverExclusionHandler)


print(f"Libcloud version {libcloud.__version__}")

def load_aws_credentials():
    credentials_path = os.path.expanduser('~/.aws/credentials')
    if os.path.exists(credentials_path):
        config = configparser.ConfigParser()
        config.read(credentials_path)
        ec2_key = config.get('default', 'aws_access_key_id', fallback=None)
        ec2_secret = config.get('default', 'aws_secret_access_key', fallback=None)
    else:
        ec2_key = os.environ.get('AWS_ACCESS_KEY_ID')
        ec2_secret = os.environ.get('AWS_SECRET_ACCESS_KEY')
    
    return ec2_key, ec2_secret

EC2_KEY, EC2_SECRET = load_aws_credentials()

GCE_CLIENT_ID = "libcloud@silver-charmer-210814.iam.gserviceaccount.com"

EC2Driver = get_driver(Provider.EC2)
GCEDriver = get_driver(Provider.GCE)

drivers = [
    EC2Driver(key=EC2_KEY, secret=EC2_SECRET, region="us-east-1"),
    GCEDriver(GCE_CLIENT_ID, "../keys/gcp.json", project="silver-charmer-210814")
]

print("Drivers loaded")

node_sizes: list[NodeSize] = []


data = []
for driver in drivers:
    sizes = driver.list_sizes()
    for size in sizes:
        size_data = {
            "id": size.id,
            "name": size.name,
            "ram": size.ram,
            "disk": size.disk,
            "bandwidth": size.bandwidth,
            "price": size.price,
            "driver_name": driver.name
        }
        data.append(size_data)

df = pd.DataFrame(data)
df.to_csv('out.csv', index=False)


# Compute and print a histogram of prices for each driver
for driver_name, group in df.groupby('driver_name'):
    plt.figure(figsize=(10, 6))
    plt.hist(group['price'].dropna(), bins=20, edgecolor='black')
    plt.title(f'Price Histogram for {driver_name}')
    plt.xlabel('Price')
    plt.ylabel('Frequency')
    plt.grid(True)
    plt.show()
    plt.save()

    # Compute the cost coverage (percent non-null prices) for that driver
    total_count = len(group)
    non_null_count = group['price'].notnull().sum()
    cost_coverage = (non_null_count / total_count) * 100
    print(f'Cost Coverage for {driver_name}: {cost_coverage:.2f}%')
