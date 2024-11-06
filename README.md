# cloudbox

Goal: build a single-binary CLI tool that (1) helps you compare cloud VM prices and (2) provision one if you provide your API keys. Have good filtering and data export, normalize the data as much as possible.

Subgoals: be able to get and export prices without providing API keys (to the extent allowed by the providers). Be as simple as possible. Have as few dependencies as possible (e.g. use plain HTTP requests to create instances instead of bringing in cloud SDKs)

Current state: I've located a bunch of the API URLs and put them in `<provider>/urls.txt`, along with an example response from that API in `<provider>/metadata|prices.json`
Some of the providers need scraping (Hetzner, and likely GCP)

The following table lists APIs I've identified, and whether they need separate API calls for VM specs (like RAM, CPU, storage, etc) and prices, or both are provided in a single API call, or you need to run a scraper because the provider doesn't provide a machine-readable API.

| Cloud Provider | Instance Specs | Instance Price | Both in One | Scraped |
| -------------- | -------------- | -------------- | ----------- | ------- |
| AWS            |                |                | ✓           |         |
| Azure          | ✓              | ✓              |             |         |
| DigitalOcean   |                |                | ✓           |         |
| Vultr          |                |                | ✓           |         |
| Linode         |                |                | ✓           |         |
| Hetzner        | *               |                |             | ✓       |
| Oracle         | *              | ✓              |             |         |
| Scaleway       |                |                | ✓           |         |
| GCP            | **             | **             |             |         |

*Hetzner does have a [Pricing API](https://docs.hetzner.cloud/#pricing) but it needs an API Key

*Oracle does have a `ListShapes` API but it is not publicly accessible

**GCP has [such a complicated system](https://github.com/sagemathinc/gcloud-pricing-calculator) I decided to hold off on implementing it.

Clouds to add:
- Alibaba Cloud 
- IBM Cloud
- Rackspace Spot
- Upcloud

## TODOS/ideas
- Normalize the data (a biggie)
- Add filtering/exports
- Add create instance, wait for SSH, get console functionality (should just use HTTP requests)
- Use [Git scraping](https://simonwillison.net/2020/Oct/9/git-scraping/) or an appended CSV/Parquet file track price changes over time
- Build a simple UI

I'm open to suggestions on the language I should implement this in (Typescript, Go, or Rust seem good)

## License
Who knows if I'll actually get around to implementing this, but its a cool idea and hopefully this research will help someone if they decide to. This repo is Apache-2.0.

## Getting started
(Only needed for the Hetzner scraper)

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.1.33. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
