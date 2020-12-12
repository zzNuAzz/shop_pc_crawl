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
                $('.paging > a').each((index, el) => {
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
                $('div.p-container-2019').each((index, el) => {
                    const product = {};
                    product.link = baseUrl + $(el).find('a.p-img-2019').attr('href');
                    product.img = $(el).find('a.p-img-2019 > img').attr('src');
                    product.name = $(el).find("a.p-name-2019").text();
                    product.price = $(el).find("span.p-price-2019").text().replace(/[^\d]/g, "");
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
    writeFileSync(__dirname + "/../../data/anphat.json", JSON.stringify(data, null," "));
})
