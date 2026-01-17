declare module 'imagesloaded' {
  interface ImagesLoaded {
    on(event: string, callback: Function): void;
    // Add more methods if needed, but 'on' is used in the codebase.
  }

  function imagesLoaded(
    elem: Element | NodeList | string,
    options?: object,
    callback?: Function
  ): ImagesLoaded;

  export default imagesLoaded;
}
