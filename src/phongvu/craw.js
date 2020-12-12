const { readFileSync } = require('fs');
const rp = require('request-promise');
const cheerio = require('cheerio');
const data = readFileSync(__dirname + '/phongvu_category.json', {
    encoding: 'utf-8',
});
const category = JSON.parse(data);
const PAGE_SELECTOR = '#__next > div:nth-child(4) > div > div.css-4xljxh > nav > ul > li';

function getPages(url) {
    return new Promise((resolve, reject) => {
        rp(url)
            .then(htmlString => {
				const $ = cheerio.load(htmlString);
				const totalPage = -2 + Array.from($(PAGE_SELECTOR)).length;
				const pages = [];
				for(let i = 1; i <= totalPage; ++i) {
					pages.push(`${url}&page=${i}`);
				}
                resolve(pages);
            })
            .catch(reject);
    });
}

const url = (page, categoryId) =>`https://phongvu.vn/_next/data/HVT-b5PPLqJ_eSMz7n_pC/phongvu/categories/553.json?pv_medium=m-cpu-bo-vi-xu-ly&page=${page}&categoryId=${categoryId}`

function getProduct({url, path}) {
	return new Promise((resolve, reject) => {
        rp(url)
            .then(htmlString => {
				const $ = cheerio.load(htmlString);
				console.log(htmlString)
				const products = [];
				$(PRODUCT_SELECTOR).each((i, elm) => {
					console.log("a")
					console.log($(this).text());
				})
				// console.log($(PRODUCT_SELECTOR));
				resolve(products);
            })
            .catch(reject);
    });
} 

async function crawl() {
	const pages = await getPages(category[0].url);
	
	const products = await getProduct({url:pages[0]});
	console.log(products);
}
