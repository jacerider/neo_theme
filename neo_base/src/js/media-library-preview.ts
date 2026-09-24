'use strict';

(function (Drupal, once) {

  /**
   * The side of the square an image is drawn at to be read.
   *
   * Only the overall picture matters (is there transparency, is what shows
   * light or dark), so a thumbnail of the thumbnail answers it for a few
   * thousand pixels instead of the full image's worth.
   */
  const SAMPLE = 32;

  /**
   * The share of see-through pixels that makes an image transparent.
   *
   * Above zero so that a stray soft pixel on an otherwise opaque photo does not
   * turn it into a letterboxed logo.
   */
  const TRANSPARENT_SHARE = 0.01;

  /**
   * The luminance at which black and white contrast equally with a colour.
   *
   * sqrt(1.05 * 0.05) - 0.05, from the WCAG contrast ratio. Above it a mark
   * reads better on the dark tile, below it on the light one. Mid-tones, a gold
   * wordmark say, land on the side that gives them more contrast rather than
   * defaulting to light.
   */
  const LIGHT_LUMINANCE = 0.179;

  function linear(channel: number): number {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  }

  /**
   * Whether an image has transparency, and whether what it draws is light.
   *
   * @return
   *   Null when the pixels cannot be read: an image served from another origin
   *   without CORS taints the canvas, and an SVG with no intrinsic size cannot
   *   be drawn at all in Firefox. The tile is then left as it was.
   */
  function analyse(img: HTMLImageElement): {transparent: boolean, light: boolean} | null {
    const canvas = document.createElement('canvas');
    canvas.width = SAMPLE;
    canvas.height = SAMPLE;
    const context = canvas.getContext('2d', {willReadFrequently: true});
    if (!context) {
      return null;
    }

    let data: Uint8ClampedArray;
    try {
      context.drawImage(img, 0, 0, SAMPLE, SAMPLE);
      data = context.getImageData(0, 0, SAMPLE, SAMPLE).data;
    }
    catch {
      return null;
    }

    let clear = 0;
    let weight = 0;
    let luminance = 0;
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3] / 255;
      if (alpha < 1) {
        clear++;
      }
      // Weighted by alpha, so a soft edge counts for what it paints.
      weight += alpha;
      luminance += alpha * (0.2126 * linear(data[i]) + 0.7152 * linear(data[i + 1]) + 0.0722 * linear(data[i + 2]));
    }

    return {
      transparent: clear / (SAMPLE * SAMPLE) > TRANSPARENT_SHARE,
      light: weight > 0 && luminance / weight > LIGHT_LUMINANCE,
    };
  }

  function classify(img: HTMLImageElement, target: HTMLElement): void {
    const result = analyse(img);
    if (!result) {
      return;
    }
    target.classList.toggle('is-transparent', result.transparent);
    // Only a transparent image shows the tile behind it, so only one can need
    // the tile darkened. An opaque light photo covers it either way.
    target.classList.toggle('is-light', result.transparent && result.light);
  }

  /**
   * Classify each image once it has loaded.
   */
  function watch(images: HTMLElement[], target: (img: HTMLImageElement) => HTMLElement | null): void {
    images.forEach((img: HTMLElement) => {
      if (!(img instanceof HTMLImageElement)) {
        return;
      }
      const element = target(img);
      if (!element) {
        return;
      }
      // The picker's grid loads its images lazily, so most are not there yet.
      if (img.complete && img.naturalWidth) {
        classify(img, element);
      }
      else {
        img.addEventListener('load', () => classify(img, element), {once: true});
      }
    });
  }

  /**
   * Fit the media library's preview tile to the image in it.
   *
   * A tile is a white box that crops its image to fill it, which suits a photo
   * and fails a logo twice over: a white mark vanishes into the white, and a
   * wide one is cropped to a slice from its middle. The CSS in
   * media-library.css answers both once an image is marked transparent (and,
   * where what it draws is light, light), but only the pixels can say which
   * images those are.
   *
   * An image field's widget preview and the media library's upload preview
   * have the first failure and not the second: they show the image whole, on
   * the form's white. There the image is marked itself, and
   * media-library-preview.css draws the checkerboard as its background, which
   * shows through exactly where the image is clear. Nothing wraps or pads it,
   * so focal point's crosshair still lands where it was dropped.
   */
  Drupal.behaviors.neoBaseMediaLibraryPreview = {};
  Drupal.behaviors.neoBaseMediaLibraryPreview.attach = (context: HTMLElement) => {
    watch(
      once('neoBase.mediaLibraryPreview', '.media-library-item--preview img', context),
      (img) => img.closest<HTMLElement>('.media-library-item--preview'),
    );
    watch(
      once('neoBase.imagePreview', '.image-widget img, .js-media-library-add-form-added-media img', context),
      (img) => img,
    );
  };

})(Drupal, once);

export {};
