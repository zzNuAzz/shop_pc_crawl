const puppeteer = require('puppeteer');

const { writeFileSync } = require('fs');
const path = require('path')
const cheerio = require('cheerio');

const { baseUrl, category } = require('./category.json');
category.map(e => {
	e.url = baseUrl + e.url;
});

const option = {
	headless: true,
	defaultViewport: null,
};

let browser = null;

puppeteer
	.launch(option)
	.then(async _browser => {
		browser = _browser;
	})
	.then(async () => {
		// const pages = await getPage(category[0].url);
		const data = [];
		logs(`\nFound ${category.length} category!`);
		logs("\nStarting crawl.................................");
		for(let i = 0, max = category.length; i < max; i++) {
			logs(`\nStart category ${i+1}`);
			const cat = await handleCategory(category[i]);
			data.push(cat);
		}
		logs('\n\nCrawling done!!!!!!!!!!!!!!!!!');
		logs('\nExporting data...');
		const savePath = __dirname + "/../../data/pc_part_picker.json";
		writeFileSync(savePath, JSON.stringify(data, null," "));
		logs("done");
		logs(`\nData: ${path.resolve(savePath)}`);

		
		await browser.close();
	});

async function handleCategory(category) {
	logs("\nHandle category:", category.url,"...");
	const pageUrls = await getPage(category.url);
	const products = [];
	const CHUNK_SIZE = 5;
	const chunk = splitChunk(pageUrls, CHUNK_SIZE);
	logs("\nSplit to", chunk.length, "chunk",`(${CHUNK_SIZE} per chunk)`);
	logs("\nStarting fetching...");
	for(let i = 0, max = chunk.length; i < max; i++) {
		logs("\nFetching chunk",`${i+1}/${chunk.length}...`)
		const productChunk = await Promise.all(chunk[i].map(getProduct));
		const flatProduct = productChunk.flat();
		products.push(...flatProduct);
	}
	logs(`\nFetching success ${products.length} product for category`);
	return {
		url: category.url,
		products,
	};
}

async function getPage(url) {
	const page = await browser.newPage();
	logs("\nGetting pages...");
	let pageUrls = [url];
	try {
		await page.goto(url, { timeout: 120000 });
		await page.waitForSelector('#category_content > tr', {
			timeout: 120000,
		});
		const pagingElement = await page.$('.pagination');
		const pagingHtml = await page.evaluate(e => e.innerHTML, pagingElement);
		const $ = cheerio.load(pagingHtml);
		const maxPage = $('li:last-child').text();
		if (url.includes('#')) {
			pageUrls.push(
				...Array(maxPage - 1)
					.fill(0)
					.map((_, i) => `${url}&page=${i + 2}`)
			);
		} else {
			pageUrls.push(
				...Array(maxPage - 1)
					.fill(0)
					.map((_, i) => `${url}#page=${i + 2}`)
			);
		}
	} catch (err) {
	} finally {
		page.close();
	}
	logs("done");
	logs("\nFound", pageUrls.length, "pages!");
	return pageUrls;
}

async function getProduct(url) {
	const page = await browser.newPage();
	let products = [];
	try {
		await page.goto(url, { timeout: 120000 });
		await page.waitForSelector('#category_content > tr', {
			timeout: 120000,
		});
		const htmlElement = await page.$('html');
		const tableHtml = await page.evaluate(e => e.innerHTML, htmlElement);
		const $ = cheerio.load(tableHtml);
		$('.tr__product').each((_, el) => {
			const product = {};
			product.Name = $(el).find('.td__name p').text();
			product.Price = $(el)
				.find('.td__price')
				.contents()
				.filter(function () {
					return this.type === 'text';
				})
				.text();
			$(el)
				.find('.td__spec')
				.each((_, el) => {
					const specLabel = $(el).find('.specLabel').text().replace(/[^A-Z0-9]/ig, "_").replace(/__/g, "_");
					const spec = $(el)
						.contents()
						.filter(function () {return this.type === 'text'})
						.text();
					product[specLabel] = spec;
				});
			products.push(product);
		});
	} catch (err) {
	} finally {
		page.close();
	}
	logs("\nFound", products.length, "products!");
	return products;
}

function splitChunk(list, chunkSize) {
	return [...Array(Math.ceil(list.length / chunkSize))].map((_, i) =>
		list.slice(chunkSize * i, chunkSize + chunkSize * i)
	);
}

function logs(...str) {
	process.stdout.write(str.join(' '));
}
