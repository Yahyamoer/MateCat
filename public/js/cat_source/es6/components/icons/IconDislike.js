import React from 'react'
import PropTypes from 'prop-types'

const IconDislike = ({size = 16}) => {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.3547 2.01579C12.1658 2.00036 11.9176 1.99984 11.5332 1.99984H10.9999V7.99979C11.0089 7.99982 11.0177 7.99984 11.0264 7.99984H11.5332C11.9176 7.99984 12.1658 7.99932 12.3547 7.98389C12.5358 7.96909 12.6029 7.94397 12.6359 7.92718C12.7613 7.86326 12.8633 7.76127 12.9272 7.63583C12.944 7.60287 12.9692 7.53572 12.984 7.35461C12.9994 7.16572 12.9999 6.91754 12.9999 6.53317V3.46651C12.9999 3.08214 12.9994 2.83395 12.984 2.64506C12.9692 2.46395 12.944 2.39681 12.9272 2.36384C12.8633 2.2384 12.7613 2.13642 12.6359 2.0725C12.6029 2.05571 12.5358 2.03059 12.3547 2.01579ZM9.66658 8.58503V1.99984H4.41192C3.91466 1.99984 3.57884 2.00029 3.31722 2.0202C3.06395 2.03948 2.9299 2.07439 2.83211 2.1187C2.60092 2.22346 2.40443 2.39203 2.26574 2.6046C2.20708 2.69451 2.15219 2.82169 2.09462 3.06909C2.03516 3.32464 1.98365 3.65648 1.90804 4.14796L1.55932 6.41463C1.45983 7.06136 1.39226 7.50436 1.36933 7.84827C1.34682 8.18578 1.37385 8.35747 1.41867 8.475C1.52896 8.76415 1.73638 9.00592 2.00539 9.15889C2.11474 9.22107 2.28033 9.27388 2.61734 9.30296C2.96073 9.33259 3.40886 9.33317 4.0632 9.33317L4.62116 9.33317C4.78942 9.33315 4.95329 9.33313 5.09206 9.34447C5.24446 9.35692 5.42428 9.3863 5.60523 9.4785C5.85611 9.60633 6.06009 9.8103 6.18792 10.0612C6.28012 10.2421 6.3095 10.422 6.32195 10.5744C6.33329 10.7131 6.33327 10.877 6.33325 11.0453L6.33324 13.0226C6.33324 13.5368 6.73036 13.9582 7.23462 13.9969L9.4425 9.0292C9.44948 9.01349 9.4566 8.99729 9.4639 8.9807C9.51703 8.85988 9.57948 8.71785 9.66658 8.58503ZM11.5589 0.666504C11.9104 0.666493 12.2135 0.666482 12.4633 0.686885C12.7268 0.708419 12.989 0.755963 13.2412 0.884492C13.6175 1.07624 13.9235 1.3822 14.1153 1.75852C14.2438 2.01078 14.2913 2.27292 14.3129 2.53649C14.3333 2.7862 14.3333 3.08937 14.3332 3.44079V6.55888C14.3333 6.91031 14.3333 7.21348 14.3129 7.46319C14.2913 7.72675 14.2438 7.9889 14.1153 8.24115C13.9235 8.61748 13.6175 8.92344 13.2412 9.11518C12.989 9.24371 12.7268 9.29126 12.4633 9.31279C12.2135 9.33319 11.9104 9.33318 11.5589 9.33317H11.0264C10.8926 9.33317 10.8234 9.33349 10.7734 9.33672C10.7719 9.33682 10.7704 9.33692 10.769 9.33702C10.7683 9.33826 10.7676 9.33957 10.7669 9.34094C10.7437 9.38534 10.7153 9.44842 10.6609 9.57072L8.42041 14.6118C8.22546 15.0505 7.79048 15.3332 7.31047 15.3332C6.03438 15.3332 4.99991 14.2987 4.99991 13.0226V11.0665C4.99991 10.8688 4.99939 10.7607 4.99304 10.6829C4.99279 10.6798 4.99253 10.6769 4.99228 10.6741C4.98951 10.6739 4.98658 10.6736 4.98349 10.6734C4.90576 10.667 4.7976 10.6665 4.59991 10.6665H4.03336C3.41619 10.6665 2.91025 10.6665 2.50272 10.6314C2.08226 10.5951 1.69671 10.5172 1.34632 10.3179C0.808301 10.012 0.393451 9.52845 0.172884 8.95017C0.0292373 8.57356 0.0108728 8.18064 0.0389507 7.75956C0.0661651 7.35142 0.143103 6.85137 0.236958 6.24138L0.594026 3.92043C0.664853 3.46001 0.723657 3.07774 0.795986 2.76691C0.871505 2.44237 0.971681 2.14791 1.14907 1.87603C1.42645 1.45088 1.81943 1.11374 2.28181 0.904224C2.5775 0.770243 2.88377 0.716006 3.21602 0.690714C3.53424 0.666491 3.921 0.666497 4.38684 0.666505L11.5589 0.666504Z"
        fill="currentColor"
      />
    </svg>
  )
}

IconDislike.propTypes = {
  size: PropTypes.number,
}

export default IconDislike
