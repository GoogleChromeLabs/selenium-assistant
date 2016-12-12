/* eslint-env browser*/

/**
 * This call simply collapses the docs on the signatures of methods.
 */
class JSDocCollapse {
  /**
   * The class configures the behaviors in the constructor.
   */
  constructor() {
    const signatureElements = document.querySelectorAll('.method-entry');
    signatureElements.forEach((element) => {
      if (element.querySelector('.js-method-collapse')) {
        this._configureElementBehavior(element);
      }
    });
  }

  /**
   * This method will configure the show and hide behavior of the collapsing
   * sections.
   * @param {DomElement} element The element to configure to show and hide.
   */
  _configureElementBehavior(element) {
    const signatureTitle = element.querySelector('.method-name');
    const collapseElement = element.querySelector('.js-method-collapse');
    const cssClassName = 'is-closed';
    signatureTitle.addEventListener('click', (event) => {
      if (collapseElement.classList.contains(cssClassName)) {
        collapseElement.classList.remove(cssClassName);
      } else {
        collapseElement.classList.add(cssClassName);
      }
    });
    collapseElement.classList.add(cssClassName);
  }
}

window.__npmPublishScripts = window.__npmPublishScripts || {};
window.__npmPublishScripts.JSDocCollapse = JSDocCollapse;
