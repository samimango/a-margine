function doGet() {
  return HtmlService.createHtmlOutputFromFile('Quaderno').setTitle('A margine').addMetaTag('viewport','width=device-width, initial-scale=1');
}
function chapter(reference) {
  return JSON.parse(UrlFetchApp.fetch(chapterUrl_(reference)).getContentText());
}
function sync(updates) {
  const lock = LockService.getUserLock();
  lock.waitLock(10000);
  try {
    const props = PropertiesService.getUserProperties();
    const stored = props.getProperties();
    const store = {};
    for (const [key, json] of Object.entries(stored)) { try { store[key]=JSON.parse(json); } catch (e) {} }
    const result = exchange_(store,updates);
    const changed = {};
    for (const {id} of updates) {
      if (!store[id] || result.conflicts[id]) continue;
      const json = JSON.stringify(store[id]);
      if (stored[id] !== json) changed[id]=json;
    }
    if(Object.keys(changed).length) props.setProperties(changed);
    return result;
  } finally { lock.releaseLock(); }
}

function wordSearch(query){return UrlFetchApp.fetch(searchUrl_(query)).getContentText();}
