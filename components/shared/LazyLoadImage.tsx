import React, { useState, useCallback } from 'react'

const PLACEHOLDER_SRC = `data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs%3D`

type PropType = {
  imgSrc: string | undefined,
  inView: boolean
  index: number
}

export const LazyLoadImage: React.FC<PropType> = (props) => {
  const { imgSrc, inView } = props
  const [hasLoaded, setHasLoaded] = useState(false)

  const setLoaded = useCallback(() => {
    if (inView) setHasLoaded(true)
  }, [inView, setHasLoaded])

  return (
    <>
      {/* <div className="embla__slide">
        <div
          className={'embla__lazy-load'.concat(
            hasLoaded ? ' embla__lazy-load--has-loaded' : ''
          )}
        > */}
      {!hasLoaded && <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>}
      <img
        className="rounded-md max-w-full max-h-full object-contain select-none "
        onLoad={setLoaded}
        src={inView ? imgSrc : PLACEHOLDER_SRC}
        alt="Your alt text"
        data-src={imgSrc}
      />
      {/* </div>
      </div> */}
    </>
  )
}
