const DOMAINS = {
  url: 'https://abema.tv',
  api: 'https://api.abema.io',
  media: 'https://media.abema.io',
  license: 'https://license.abema.io',
  license_np: 'https://license.abema.io',
  hayabusa: 'https://hayabusa.io/abema',
  growthlink: 'https://ul.gbt.io/l/abematv',
  appstore: 'https://itunes.apple.com/us/app/abematv/id1074866833?l=ja&ls=1&mt=8',
  googleplay: 'market://details?id=tv.abema',
  facebookpage: 'https://www.facebook.com/abematv/',
  tvguide: 'https://guide.abema.tv/',
  ranking: 'https://ranking.abema.tv/',
  adCross: 'http://ad.pr.ameba.jp',
  akamaized: 'https://abematv.akamaized.net',
  status: 'https://storage.googleapis.com/abema-status',
  payment: 'https://p01.mul-pay.jp/link/9100763125609',
  ga_optout: 'https://tools.google.com/dlpage/gaoptout',
  lance_image: 'https://sy.ameblo.jp/sync/?org=sy.abema.tv',
};

const URL = {
  base: DOMAINS.url,
  slot_play: DOMAINS.media + '/slot',
  channel_play: DOMAINS.media + '/channel',
  channel_logo: DOMAINS.hayabusa + '/channels/logo',
  channel_now_on_air: DOMAINS.hayabusa + '/channels/time',
  program_image: DOMAINS.hayabusa + '/programs',
  slot_thumbnail_list: DOMAINS.hayabusa + '/slots',
  title_image: DOMAINS.hayabusa + '/series',
  growthlink: DOMAINS.growthlink,
  appstore: DOMAINS.appstore,
  googleplay: DOMAINS.googleplay,
  facebookpage: DOMAINS.facebookpage,
  tvguide: DOMAINS.tvguide,
  ranking: DOMAINS.ranking,
  adCross: DOMAINS.adCross,
  corporation: 'http://abematv.co.jp',
  maintenance: DOMAINS.status + '/maintenance.json',
  payment: DOMAINS.payment + '/Member/Edit',
  ga_optout: DOMAINS.ga_optout,
  lance_image: DOMAINS.lance_image,
  contact: 'http://abematv.co.jp/pages/394742/contact',
};

const DEFAULT_TIMEOUT = 7000;
const CACHE_MILLISECONDS = 30000;
const RETRY_INTERVAL = 1000;
const PLAYLIST_FETCH_INTERVAL = 5000;

const TS_DUMP_CACHE_PATH = 'tsdump';
const TS_DOWNLOAD_PATH = 'downloads';

module.exports = {
  DEFAULT_TIMEOUT,
  CACHE_MILLISECONDS,
  RETRY_INTERVAL,
  PLAYLIST_FETCH_INTERVAL,
  TS_DUMP_CACHE_PATH,
  TS_DOWNLOAD_PATH,
  DOMAINS,
  URL,
};
