import { p as promiseResolve, b as bootstrapLazy } from './p-06d04c4b.js';
export { s as setNonce } from './p-06d04c4b.js';

/*
 Stencil Client Patch Browser v3.2.2 | MIT Licensed | https://stenciljs.com
 */
const patchBrowser = () => {
    const importMeta = import.meta.url;
    const opts = {};
    // TODO(STENCIL-663): Remove code related to deprecated `safari10` field.
    if (importMeta !== '') {
        opts.resourcesUrl = new URL('.', importMeta).href;
        // TODO(STENCIL-661): Remove code related to the dynamic import shim
        // TODO(STENCIL-663): Remove code related to deprecated `safari10` field.
    }
    return promiseResolve(opts);
};

patchBrowser().then(options => {
  return bootstrapLazy([["p-f3b498af",[[0,"pace-select",{"label":[1],"name":[1],"value":[8],"options":[16],"onChange":[16],"onInput":[16],"searchable":[4],"readonly":[4],"loading":[4],"required":[4],"selectStyle":[16],"hideOptions":[32],"selectedOptionIdx":[32]}]]],["p-6b665560",[[1,"pace-search-form",{"searchFlights":[32]}],[1,"pace-message-box",{"searchFlights":[32]}],[0,"pace-result-box",{"showEquivalents":[4,"show-equivalents"],"searchFlights":[32]}]]],["p-d102ff0c",[[1,"pace-carboncalculator",{"apikey":[1],"theme":[1],"showEquivalents":[4,"show-equivalents"],"applyLoadFactor":[4,"apply-load-factor"],"landscapeMode":[4,"landscape-mode"],"containerWidth":[1,"container-width"],"logoMod":[1,"logo-mod"]}]]]], options);
});

//# sourceMappingURL=pace-carbon-calculator-widget.esm.js.map