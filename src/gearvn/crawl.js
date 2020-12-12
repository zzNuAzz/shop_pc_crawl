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
                const listPages = Array.from($(".pagination-list > li"));
                if(listPages.length > 0) {
                    let maxPage = 0;
                    $(".pagination-list > li").each((id, el) => {
                        const title = $(el).find('a').attr('title');
                        const pageNum = parseInt(title, 10);
                        if(Number.isNaN(pageNum) === false && pageNum > maxPage) {
                            maxPage = pageNum;
                        }
                    });
                    const page = [...Array(maxPage)].map((e,id) => `${url}?page=${id+1}`);
                    pages.push(...page);
                }
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
            $('div.row.content-product-list > div').each((index, el) => {
                const product = {};
                product.link = baseUrl + $(el).find('div.product-row > a').attr('href');
                product.img = $(el).find('div.product-row-img img').attr('src');
                product.name = $(el).find("h2.product-row-name").text();
                product.price = $(el).find("span.product-row-sale").text().replace(/[^\d]/g, "");
                if(!product.price) {
                    product.price = "Liên hệ"
                }
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
    writeFileSync(__dirname + "/../../data/gearvn.json", JSON.stringify(data, null," "));
})
