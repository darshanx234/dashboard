declare module 'masonry-layout' {
  interface MasonryOptions {
    itemSelector?: string;
    columnWidth?: number | string;
    gutter?: number | string;
    percentPosition?: boolean;
    stamp?: string;
    fitWidth?: boolean;
    originLeft?: boolean;
    originTop?: boolean;
    containerStyle?: object;
    transitionDuration?: string | number;
    resize?: boolean;
    initLayout?: boolean;
    horizontalOrder?: boolean;
  }

  class Masonry {
    constructor(element: Element | string, options?: MasonryOptions);
    
    layout(): void;
    layoutItems(items: any[], isStill?: boolean): void;
    stamp(elements: Element | Element[]): void;
    unstamp(elements: Element | Element[]): void;
    appended(elements: Element | Element[]): void;
    prepended(elements: Element | Element[]): void;
    addItems(elements: Element | Element[]): void;
    remove(elements: Element | Element[]): void;
    reloadItems(): void;
    destroy(): void;
    getItemElements(): Element[];
    on(eventName: string, listener: Function): void;
    off(eventName: string, listener: Function): void;
    once(eventName: string, listener: Function): void;
  }

  export default Masonry;
}
