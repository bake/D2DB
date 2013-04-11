/*
 * JavaScript Pretty Date
 * Copyright (c) 2011 John Resig (ejohn.org)
 * Licensed under the MIT and GPL licenses.
 */
function prettyDate(e){var t=new Date((e||"").replace(/-/g,"/").replace(/[TZ]/g," ")),n=((new Date).getTime()-t.getTime())/1e3,r=Math.floor(n/86400);if(isNaN(r)||r<0||r>=31)return;return r==0&&(n<60&&"gerade eben"||n<120&&"vor einer Minute"||n<3600&&"vor "+Math.floor(n/60)+" Minuten"||n<7200&&"vor einer Stunde"||n<86400&&"vor "+Math.floor(n/3600)+" Stunden")||r==1&&"Gestern"||r<7&&"vor "+r+" Tagen"||r<31&&"vor "+Math.ceil(r/7)+" Wochen"}