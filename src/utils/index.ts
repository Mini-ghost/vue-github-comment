/* eslint-disable import/prefer-default-export */

interface Query {
  [key: string]: string
}


export const getMetaContent = (
  name: string,
  content: string = 'content',
) => {
  const el = window.document.querySelector(`meta[name='${name}']`);
  return el && el.getAttribute(content);
};

export const queryParse = (search: string = window.location.search) => {
  if (!search) return {};
  const queryString = search[0] === '?'
    ? search.substring(1)
    : search;
  const query: Query = {};
  queryString
    .split('&')
    .forEach((queryStr) => {
      const [key, value] = queryStr.split('=');
      if (key) {
        query[decodeURIComponent(key)] = decodeURIComponent(value);
      }
    });

  return query;
};

export const queryStringify = (query: Query) => {
  const queryString = Object.keys(query)
    .map((key) => `${key}=${encodeURIComponent(query[key] || '')}`)
    .join('&');
  return queryString;
};

export const jsonReturn = <T extends Object>(data: T): T => {
  if (typeof data !== 'object') {
    return data;
  }
  return JSON.parse(JSON.stringify(data));
};
