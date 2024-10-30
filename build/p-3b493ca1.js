class ApiKeyHolder {
  constructor() {
    this.apiKey = "";
  }
  getApiKey() {
    return this.apiKey;
  }
  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }
}
const defaultApiKeyHolder = new ApiKeyHolder();

class Theme {
  constructor() {
    this.theme = {
      fontFamily: "",
      primaryColor: "",
      primaryBackgroundColor: "",
      secondaryColor: "",
      secondaryBackgroundColor: "",
      selectedColor: "",
    };
    this.isLandscape = false;
  }
  setTheme(theme) {
    this.theme = theme;
  }
  setLandscapeMode(isLandscape) {
    this.isLandscape = isLandscape;
  }
  getHostStyle(maxWidth) {
    const hostStyle = {
      "background-color": this.theme.secondaryBackgroundColor,
      color: this.theme.secondaryColor,
      width: "100%",
      "max-width": maxWidth,
    };
    return this.optionalFontFamily(hostStyle);
  }
  getSubHostStyle() {
    const hostStyle = {
      color: this.theme.secondaryColor,
    };
    return this.optionalFontFamily(hostStyle);
  }
  getInputStyle() {
    return {
      color: this.theme.primaryColor,
      "background-color": this.theme.primaryBackgroundColor,
    };
  }
  getLinkStyle() {
    return {
      color: this.theme.primaryColor,
    };
  }
  getIconStyle() {
    return {
      fill: this.theme.primaryColor,
    };
  }
  getPrimaryButtonStyle() {
    return this.optionalFontFamily({
      color: this.theme.secondaryBackgroundColor,
      "background-color": this.theme.primaryColor,
    });
  }
  getSecondaryButtonStyle() {
    return this.optionalFontFamily({
      border: `1px solid ${this.theme.primaryColor}`,
      color: this.theme.primaryColor,
      "background-color": this.theme.secondaryBackgroundColor,
    });
  }
  getOptionsStyle() {
    return this.optionalFontFamily({
      "background-color": this.theme.secondaryBackgroundColor,
      border: `1px solid ${this.theme.primaryBackgroundColor}`,
    });
  }
  getHighlightedOptionStyle() {
    return this.optionalFontFamily({
      "background-color": this.theme.selectedColor,
    });
  }
  getContentStyle() {
    return this.optionalFontFamily({
      "background-color": this.theme.primaryBackgroundColor,
    });
  }
  getContentSecondaryStyle() {
    return this.optionalFontFamily({
      "background-color": this.theme.secondaryBackgroundColor,
    });
  }
  getSectionContainerClass() {
    return this.isLandscape && "row--landscape";
  }
  getSectionClass(colSize) {
    if (this.isLandscape) {
      return `col-${colSize}--landscape col-${colSize}--spaced section--no-margin`;
    }
    return "section--margin";
  }
  optionalFontFamily(style) {
    const fontFamily = this.theme.fontFamily;
    if (fontFamily) {
      return Object.assign(Object.assign({}, style), { "font-family": fontFamily });
    }
    return style;
  }
}
const defaultTheme = new Theme();

class CustomParametersHolder {
  constructor() {
    this.loadFactor = false;
  }
  isLoadFactorApplicable() {
    return this.loadFactor;
  }
  setLoadFactorApplicable(applicableLoadFactor) {
    this.loadFactor = applicableLoadFactor;
  }
}
const defaultCustomParametersHolder = new CustomParametersHolder();

export { defaultApiKeyHolder as a, defaultCustomParametersHolder as b, defaultTheme as d };

//# sourceMappingURL=p-3b493ca1.js.map