import { r as registerInstance, h, F as Fragment } from './p-06d04c4b.js';

const selectCss = ":host{color:#435266;font-family:\"Open Sans\", sans-serif}.select-arrow svg{cursor:pointer}.select-arrow svg:hover{fill:#f2f6f4;background-color:#435266;opacity:80%;border-radius:10px}input[type=text],input[type=number],select{padding:20px 15px;border-radius:10px;background-color:#f2f6f4;border:0;font-family:\"Open Sans\", sans-serif;font-size:1em}label{margin-bottom:5px}.form-control{display:flex;flex-direction:column}.form-control a{margin-top:5px}input[type=submit]{margin-top:20px}button,.button{width:100%;border:0;padding:20px 10px;border-radius:10px;margin-top:10px;cursor:pointer;font-weight:bold}button.button-primary,.button.button-primary{color:#ffffff;background-color:#2d9395}button.button-secondary,.button.button-secondary{border:1px solid #2d9395;color:#2d9395;background-color:#ffffff}a{text-decoration:underline;color:#2d9395;cursor:pointer}a:visited{color:#2d9395}.align-bottom{display:flex;align-items:self-end}.select-wrapper{position:relative;box-sizing:border-box}.select-wrapper input{box-sizing:border-box;width:100%}.select-wrapper ul.select-options{list-style:none;border:1px solid #f2f6f4;background-color:#ffffff;position:absolute;margin:0;padding:0;width:100%;z-index:9999;max-height:200px;overflow-y:auto;text-align:left;}.select-wrapper ul.select-options li{padding:10px;cursor:pointer}.select-wrapper ul.select-options li.selected{background-color:#f2f6f4}.select-wrapper ul.select-options li.highlighted{background-color:#ddd}.select-wrapper ul.select-options::-webkit-scrollbar{width:10px}.select-wrapper ul.select-options::-webkit-scrollbar-track{background:transparent}.select-wrapper ul.select-options::-webkit-scrollbar-thumb{background:#aaa;border-radius:5px}.select-wrapper ul.select-options::-webkit-scrollbar-thumb:hover{background:#555}.select-wrapper .select-arrow{position:absolute;top:30%;right:10px}.select-wrapper .spinner_ajPY{transform-origin:center;animation:spinner_AtaB 0.75s infinite linear}@keyframes spinner_AtaB{100%{transform:rotate(360deg)}}";

const SelectComponent = class {
  constructor(hostRef) {
    registerInstance(this, hostRef);
    this.lockOptions = false;
    this.optionElements = [];
    this.label = undefined;
    this.name = undefined;
    this.value = undefined;
    this.options = undefined;
    this.onChange = undefined;
    this.onInput = undefined;
    this.searchable = undefined;
    this.readonly = undefined;
    this.loading = undefined;
    this.required = undefined;
    this.selectStyle = { input: {}, options: {}, selectedOption: {}, highlightedOption: {} };
    this.hideOptions = true;
    this.selectedOptionIdx = 0;
  }
  resetOptions() {
    this.lockOptions = false;
    this.hideOptions = true;
  }
  handleOptionClick(value) {
    this.onChange({ target: { value: value } });
    this.resetOptions();
  }
  componentDidRender() {
    var _a, _b;
    if (this.hideOptions) {
      this.textElement.value =
        (_b = (_a = this.options.find((o) => o.value === this.value)) === null || _a === void 0 ? void 0 : _a.label) !== null && _b !== void 0 ? _b : "";
    }
  }
  scollElementIntoView(element) {
    if (element) {
      element.scrollIntoView({
        block: "center",
        inline: "center",
      });
    }
  }
  handleKeyDown(e) {
    if (this.readonly)
      return;
    const options = this.options;
    const selectedOptionIdx = this.selectedOptionIdx;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (selectedOptionIdx < options.length - 1) {
          this.selectedOptionIdx = selectedOptionIdx + 1;
        }
        this.scollElementIntoView(this.optionElements[selectedOptionIdx]);
        break;
      case "ArrowUp":
        e.preventDefault();
        if (selectedOptionIdx > 0) {
          this.selectedOptionIdx = selectedOptionIdx - 1;
        }
        this.scollElementIntoView(this.optionElements[selectedOptionIdx]);
        break;
      case "Enter":
        e.preventDefault();
        this.handleOptionClick(options[selectedOptionIdx].value);
        break;
      case "Escape":
        e.preventDefault();
        this.resetOptions();
        break;
    }
  }
  handleInputOnBlur() {
    if (!this.lockOptions) {
      this.hideOptions = true;
    }
  }
  handleInputOnFocus() {
    this.hideOptions = false;
    this.textElement.select();
  }
  handleOnInput(e) {
    if (this.hideOptions) {
      this.hideOptions = false;
    }
    this.selectedOptionIdx = 0;
    this.onInput(e);
  }
  getOptionHighlightStyle(option) {
    const isSelected = option.value === this.value, isHighlighted = this.options.indexOf(option) === this.selectedOptionIdx;
    if (isHighlighted) {
      return this.selectStyle.highlightedOption;
    }
    if (isSelected) {
      return this.selectStyle.selectedOption;
    }
    return {};
  }
  render() {
    return (h(Fragment, null, h("label", { htmlFor: this.name }, this.label), h("div", { class: "select-wrapper" }, h("input", { style: this.selectStyle.input, autoComplete: "off", placeholder: "Type to get suggestions...", readOnly: !this.searchable || this.readonly, ref: (el) => {
        this.textElement = el;
      }, type: "text", id: this.name, name: this.name, required: this.required, onFocus: () => this.handleInputOnFocus(), onBlur: () => this.handleInputOnBlur(), onInput: (e) => this.handleOnInput(e), onKeyDown: (e) => this.handleKeyDown(e) }), h("div", { class: "select-arrow", style: {
        position: "absolute",
      } }, this.readonly || (h("svg", { height: "20", width: "20", viewBox: "0 0 20 20", "aria-hidden": "true", focusable: "false", class: "css-8mmkcg", onClick: () => {
        this.textElement.focus();
      } }, h("path", { d: "M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z" }))), !this.loading || (h("svg", { width: "24", height: "24", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" }, h("path", { d: "M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z", opacity: ".25" }), h("path", { d: "M10.14,1.16a11,11,0,0,0-9,8.92A1.59,1.59,0,0,0,2.46,12,1.52,1.52,0,0,0,4.11,10.7a8,8,0,0,1,6.66-6.61A1.42,1.42,0,0,0,12,2.69h0A1.57,1.57,0,0,0,10.14,1.16Z", class: "spinner_ajPY" })))), this.readonly || (h("ul", { class: "select-options", style: this.selectStyle.options, hidden: this.hideOptions, onMouseEnter: () => (this.lockOptions = true), onMouseLeave: () => (this.lockOptions = false) }, this.options.map((option) => (h("li", { ref: (el) => (this.optionElements[this.options.indexOf(option)] = el), key: option.value, class: {
        selected: option.value === this.value,
        highlighted: this.options.indexOf(option) === this.selectedOptionIdx,
      }, style: this.getOptionHighlightStyle(option), onClick: () => this.handleOptionClick(option.value), onMouseEnter: () => {
        this.selectedOptionIdx = this.options.indexOf(option);
      } }, option.label))))))));
  }
};
SelectComponent.style = selectCss;

export { SelectComponent as pace_select };

//# sourceMappingURL=p-f3b498af.entry.js.map