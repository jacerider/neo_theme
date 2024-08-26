((t, o) => {
  t.behaviors.neoMediaLibrary = {
    attach: function() {
      t.neoMediaLibrary.init();
    }
  }, t.neoMediaLibrary = {
    init: function() {
      o("media-library-select-all", '.js-media-library-view[data-view-display-id="page"]').forEach((c) => {
        if (c.querySelectorAll(".js-media-library-item").length) {
          const e = document.querySelector(".media-library-views-form"), i = document.createElement("label");
          i.className = "media-library-select-all", i.innerHTML = t.theme("checkbox") + t.t("Select all media"), i.children[0].addEventListener("click", (a) => {
            const r = a.currentTarget, n = r.closest(".js-media-library-view").querySelectorAll(".js-media-library-item .form-boolean");
            n.forEach((l) => {
              l.checked !== r.checked && (l.checked = r.checked, l.dispatchEvent(new Event("change")));
            });
            const d = r.checked ? t.t("All @count items selected", {
              "@count": n.length
            }) : t.t("Zero items selected");
            t.announce(d), this.bulkOperations();
          }), e.prepend(i);
        }
        this.itemSelect();
      });
    },
    itemSelect: () => {
      document.querySelectorAll(".media-library-view .js-click-to-select-trigger, .media-library-view .media-library-item .form-checkbox").forEach((c) => {
        c.addEventListener("click", () => {
          const e = document.querySelector(".media-library-select-all .form-boolean"), i = document.querySelectorAll(".media-library-view .media-library-item .form-boolean"), a = document.querySelectorAll(".media-library-view .media-library-item .form-boolean:checked");
          e && e.checked === !0 && i.length !== a.length ? (e.checked = !1, e.dispatchEvent(new Event("change"))) : i.length === Array.from(i).filter((r) => r.checked === !0).length && (e.checked = !0, e.dispatchEvent(new Event("change"))), t.neoMediaLibrary.bulkOperations();
        });
      });
    },
    bulkOperations: () => {
      const c = document.querySelector('.media-library-view [data-drupal-selector*="edit-header"]'), e = document.querySelector(".media-library-views-form__bulk_form");
      c && document.querySelectorAll(".media-library-view .form-checkbox:checked").length > 0 ? (c.classList.add("is-sticky"), e == null || e.setAttribute("data-drupal-sticky-vbo", !0)) : (c.classList.remove("is-sticky"), e == null || e.setAttribute("data-drupal-sticky-vbo", !1));
    }
  };
})(Drupal, once);
//# sourceMappingURL=media.library.js.map
