import { Route } from '@/types';
import got from '@/utils/got';
import { load } from 'cheerio';
import { parseDate } from '@/utils/parse-date';

export const route: Route = {
    path: '/:uid',
    categories: ['anime'],
    example: '/xmanhua/73xm',
    parameters: { uid: '漫画 id,在浏览器中可见，例如鬼灭之刃对应的 id 为 `73xm`' },
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
        nsfw: true,
    },
    radar: [
        {
            source: ['xmanhua.com/:uid'],
        },
    ],
    name: '最新动态',
    maintainers: ['Ye11'],
    handler,
};

async function handler(ctx) {
    const uid = ctx.req.param('uid');
    const host = 'https://xmanhua.com';
    const url = `https://xmanhua.com/${uid}/`;
    const response = await got({
        method: 'get',
        url,
        headers: {
            Referer: host,
        },
    });

    const data = response.data;
    const $ = load(data);
    const list = $('div #chapterlistload').find('.detail-list-form-item');
    // 作者
    const autherName = $('body > div.detail-info-1 > div > div > p.detail-info-tip > span:nth-child(1)').text().split('：')[1];
    // 检查漫画是否已经完结
    const finished_text = $('div.detail-list-form-title').clone().children().remove().end().text();
    let finished = false;
    let newOneDate = finished_text.split(',')[1];
    if (newOneDate.includes('月') && newOneDate.includes('號')) {
        const month = Number.parseInt(newOneDate.split('月')[0]);
        const date = Number.parseInt(newOneDate.split('月')[1].split('號')[0]);
        const year = new Date().getFullYear();
        newOneDate = new Date(year, month - 1, date + 1);
    } else {
        newOneDate = new Date(newOneDate);
        newOneDate.setDate(newOneDate.getDate() + 1);
    }
    if (finished_text.includes('已完結') || finished_text.includes('已完结')) {
        finished = true;
    }
    // 最新一话的地址
    const updatedOne = $('div.detail-list-form-title span.s a').attr('href');
    const items = list.toArray().map((item) => {
        item = $(item);
        const itemTitle = item.text();
        const itemUrl = item.attr('href');
        const itemDate = itemUrl === updatedOne ? parseDate(newOneDate) : '';
        return {
            title: itemTitle,
            link: host + itemUrl,
            auther: autherName,
            pubDate: itemDate,
            guid: host + itemUrl,
        };
    });
    const name = $('body > div.detail-info-1 > div > div > p.detail-info-title').text();
    const description_ = finished ? '已完结' : '连载中';
    return {
        title: `x漫画  ${name}`,
        link: `https://xmanhua.com/${uid}`,
        description: description_,
        allowEmpty: true,
        item: items,
    };
}
