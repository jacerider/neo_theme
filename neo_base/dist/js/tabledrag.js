((a, e) => {
  e.behaviors.neoTableDrag = {
    attach(l, t) {
      const r = (n) => {
        const i = a(n).find("td:first-of-type").eq(0).wrapInner(e.theme("tableDragCellContentWrapper")).wrapInner(
          a(e.theme("tableDragCellItemsWrapper")).addClass(
            "js-tabledrag-cell-content"
          )
        ).find(".js-tabledrag-cell-content");
        i.eq(0).find(
          "> .tabledrag-cell-content--item > .js-tabledrag-handle, > .tabledrag-cell-content--item > .js-indentation"
        ).prependTo(i);
      };
      Object.keys(t.tableDrag || {}).forEach((n) => {
        once(
          "neoTabledrag",
          a(l).find(`#${n}`).find("> tr.draggable, > tbody > tr.draggable")
        ).forEach(r);
      });
    }
  }, a.extend(e.tableDrag.prototype.row.prototype, {
    /**
     * Add an asterisk or other marker to the changed row.
     *
     * @todo this may be removable as part of https://drupal.org/node/3084910
     */
    markChanged() {
      const l = a(e.theme("tableDragChangedMarker")).addClass(
        "js-tabledrag-changed-marker"
      ), t = a(this.element).find("td:first-of-type");
      t.find(".js-tabledrag-changed-marker").length === 0 && t.find(".js-tabledrag-handle").after(l), e.tableDrag[this.table.id].changedRowIds.add(this.element.id);
    },
    /**
     * Moves added indents into Claro's wrapper element.
     *
     * For indents to work properly, they must be inside the wrapper
     * created by createItemWrapBoundaries(). When an indent is added via
     * dragging, core's tabledrag functionality does not add it inside the
     * wrapper. This function fires immediately after an indent is added, which
     * moves the indent into that wrapper.
     *
     * @see Drupal.tableDrag.prototype.row.prototype.indent
     *
     * @todo this may be removable as part of https://drupal.org/node/3083044
     */
    onIndent() {
      a(this.table).find(".tabledrag-cell > .js-indentation").each((l, t) => {
        const r = a(t), n = r.siblings(
          ".tabledrag-cell-content"
        );
        r.prependTo(n);
      });
    }
  }), a.extend(
    e.theme,
    /** @lends Drupal.theme */
    {
      /**
       * Constructs the table drag changed marker.
       *
       * @return {string}
       *   Markup for the indentation.
       */
      tableDragIndentation() {
        return '<div class="js-indentation indentation"><svg xmlns="http://www.w3.org/2000/svg" class="tree" width="25" height="25" viewBox="0 0 25 25"><path class="tree--item tree--item-child-ltr tree--item-child-last-ltr tree--item-horizontal tree--item-horizontal-right" d="M12,12.5 H25" stroke="#888"/><path class="tree--item tree--item-child-rtl tree--item-child-last-rtl tree--item-horizontal tree--horizontal-left" d="M0,12.5 H13" stroke="#888"/><path class="tree--item tree--item-child-ltr tree--item-child-rtl tree--item-child-last-ltr tree--item-child-last-rtl tree--vertical tree--vertical-top" d="M12.5,12 v-99" stroke="#888"/><path class="tree--item tree--item-child-ltr tree--item-child-rtl tree--vertical tree--vertical-bottom" d="M12.5,12 v99" stroke="#888"/></svg></div>';
      },
      /**
       * Constructs the table drag changed warning.
       *
       * @return {string}
       *   Markup for the warning.
       */
      tableDragChangedWarning() {
        return `<div class="tabledrag-changed-warning messages messages--warning" role="alert">${e.theme(
          "tableDragChangedMarker"
        )} ${e.t("You have unsaved changes.")}</div>`;
      },
      /**
       * Constructs the table drag handle.
       *
       * @return {string}
       *   A string representing a DOM fragment.
       */
      tableDragHandle: () => `<a href="#" title="${e.t(
        "Drag to re-order"
      )}" class="tabledrag-handle js-tabledrag-handle"></a>`,
      /**
       * The button for toggling table row weight visibility.
       *
       * @return {string}
       *   HTML markup for the weight toggle button and its container.
       */
      tableDragToggle: () => `<div class="tabledrag-toggle-weight-wrapper" data-drupal-selector="tabledrag-toggle-weight-wrapper">
            <button type="button" class="link action-link tabledrag-toggle-weight" data-drupal-selector="tabledrag-toggle-weight"></button>
            </div>`,
      /**
       * Constructs contents of the toggle weight button.
       *
       * @param {boolean} show
       *   If the table weights are currently displayed.
       *
       * @return {string}
       *  HTML markup for the weight toggle button content.
       */
      toggleButtonContent: (l) => {
        const t = [
          "action-link",
          "action-link--extrasmall"
        ];
        let r = "";
        return l ? (t.push("action-link--icon-hide"), r = e.t("Hide row weights")) : (t.push("action-link--icon-show"), r = e.t("Show row weights")), `<span class="${t.join(" ")}">${r}</a>`;
      },
      /**
       * Constructs the wrapper for the initial content of the drag cell.
       *
       * @return {string}
       *   A string representing a DOM fragment.
       */
      tableDragCellContentWrapper() {
        return '<div class="tabledrag-cell-content--item"></div>';
      },
      /**
       * Constructs the wrapper for the whole table drag cell.
       *
       * @return {string}
       *   A string representing a DOM fragment.
       */
      tableDragCellItemsWrapper() {
        return '<div class="tabledrag-cell-content"></div>';
      }
    }
  );
})(jQuery, Drupal);
//# sourceMappingURL=tabledrag.js.map
