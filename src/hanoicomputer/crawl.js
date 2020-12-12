const { readFileSync, writeFileSync } = require('fs');
const rp = require('request-promise');
const cheerio = require('cheerio');
const data = readFileSync(__dirname + '/category.json', {
    encoding: 'utf-8',
});
const { baseUrl, category } = JSON.parse(data);
category.map(e => {
    e.url = baseUrl + e.url;
});

function getPaging(url) {
    return new Promise((resolve, reject) => {
        rp(url)
            .then(htmlString => {
                const $ = cheerio.load(htmlString);
                const pages = [];
                $('.paging:first-child > a').each((index, el) => {
                    pages.push(baseUrl + $(el).attr('href'));
                });
                if(pages.length === 0) pages.push(url);
                resolve(pages);
            })
            .catch(reject);
    });
}

function getProduct(url) {
    return new Promise((resolve, reject) => {
        rp(url)
            .then(htmlString => {
                const $ = cheerio.load(htmlString);
                const products = [];
                $('.p-component.item').each((index, el) => {
                    const product = {};
                    product.link = baseUrl + $(el).find('div.p-img > a').attr('href');
                    product.img = $(el).find('div.p-img > a > img').attr('data-src');
                    product.name = $(el).find("div.p-info > h3 > a").text();
                    product.price = $(el).find("div.p-info span.p-price").attr('data-price');
                    products.push(product)
                });

                resolve(products);
            })
            .catch(reject);
    });
}

async function craw({ url, path }) {
    const pages = await getPaging(url);
    const productsPage = await Promise.all(pages.map(getProduct));
    const products = productsPage.flat();
    console.log(`${path}: find ${products.length} items`);
    return products.map(e => {
        e.path = path;
        return e;
    });
}

Promise.all(category.map(craw)).then(data => {
    writeFileSync(__dirname + "/../../data/hanoi.json", JSON.stringify(data, null," "))
})
