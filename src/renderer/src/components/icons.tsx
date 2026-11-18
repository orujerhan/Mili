import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function Svg({ size = 16, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

export const HomeIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4 10.5 12 4l8 6.5" />
    <path d="M6 9.8V19a1 1 0 0 0 1 1h3.5v-4.5h3V20H17a1 1 0 0 0 1-1V9.8" />
  </Svg>
)

export const TimerIcon = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="12" cy="13" r="7.5" />
    <path d="M12 9.5V13l2.2 1.6M9.5 2.5h5M12 2.5v3" />
  </Svg>
)

export const TasksIcon = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m8.4 12.3 2.4 2.4 4.6-5" />
  </Svg>
)

export const NoteIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M6 3.5h9.5L19 7v13.5H6z" />
    <path d="M15 3.5V7h3.5M9 12h6M9 15.5h4" />
  </Svg>
)

export const CareIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 20s-7-4.3-7-9a3.9 3.9 0 0 1 7-2.4A3.9 3.9 0 0 1 19 11c0 4.7-7 9-7 9Z" />
  </Svg>
)

export const PinIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M9 3.5h6l-.8 5.2 3.3 3.1H15v6l-3 2.7-3-2.7v-6H6.5l3.3-3.1z" />
  </Svg>
)

export const GearIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M3.5 7.5h8.5M17.5 7.5h3M3.5 16.5h5M13.5 16.5h7" />
    <circle cx="14.7" cy="7.5" r="2.3" />
    <circle cx="10.7" cy="16.5" r="2.3" />
  </Svg>
)

export const ChevronDownIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="m6.5 9.5 5.5 5.5 5.5-5.5" />
  </Svg>
)

export const ChevronUpIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="m6.5 14.5 5.5-5.5 5.5 5.5" />
  </Svg>
)

export const ArrowLeftIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M19 12H5M11 5.5 4.5 12l6.5 6.5" />
  </Svg>
)

export const MinusIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M5 12h14" />
  </Svg>
)

export const XIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Svg>
)

export const PlayIcon = (props: IconProps) => (
  <Svg {...props} fill="currentColor" stroke="none">
    <path d="M8.5 5.6a1 1 0 0 1 1.5-.87l8 6.4a1 1 0 0 1 0 1.74l-8 6.4a1 1 0 0 1-1.5-.87z" />
  </Svg>
)

export const PauseIcon = (props: IconProps) => (
  <Svg {...props} fill="currentColor" stroke="none">
    <rect x="7" y="5" width="3.6" height="14" rx="1.2" />
    <rect x="13.4" y="5" width="3.6" height="14" rx="1.2" />
  </Svg>
)

export const PrevIcon = (props: IconProps) => (
  <Svg {...props} fill="currentColor" stroke="none">
    <path d="M7 5.5a1 1 0 0 1 2 0v13a1 1 0 0 1-2 0z" />
    <path d="M17.6 6.2a1 1 0 0 0-1.55-.83l-7.1 5.8a1 1 0 0 0 0 1.66l7.1 5.8a1 1 0 0 0 1.55-.83z" />
  </Svg>
)

export const NextIcon = (props: IconProps) => (
  <Svg {...props} fill="currentColor" stroke="none">
    <path d="M15 5.5a1 1 0 0 1 2 0v13a1 1 0 0 1-2 0z" />
    <path d="M6.4 6.2a1 1 0 0 1 1.55-.83l7.1 5.8a1 1 0 0 1 0 1.66l-7.1 5.8A1 1 0 0 1 6.4 17.8z" />
  </Svg>
)

export const MusicIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M9 18V6.5l9-2v11" />
    <circle cx="6.5" cy="18" r="2.5" />
    <circle cx="15.5" cy="15.5" r="2.5" />
  </Svg>
)

export const PlusIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
)

export const TrashIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4.5 7h15M9.5 7V4.8h5V7M6.5 7l.8 12.2a1 1 0 0 0 1 .8h7.4a1 1 0 0 0 1-.8L17.5 7" />
  </Svg>
)

export const CheckIcon = (props: IconProps) => (
  <Svg {...props} strokeWidth={3}>
    <path d="m5 12.5 4.4 4.4L19 7" />
  </Svg>
)

export const BellIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M6 9.6a6 6 0 0 1 12 0c0 4.1 1.5 5.6 1.5 5.6h-15S6 13.7 6 9.6Z" />
    <path d="M10 18.4a2 2 0 0 0 4 0" />
  </Svg>
)

export const DropletIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 3.2s5.6 5.6 5.6 9.6a5.6 5.6 0 1 1-11.2 0c0-4 5.6-9.6 5.6-9.6Z" />
  </Svg>
)

export const EyeIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M2.8 12S6 6.5 12 6.5 21.2 12 21.2 12 18 17.5 12 17.5 2.8 12 2.8 12Z" />
    <circle cx="12" cy="12" r="2.6" />
  </Svg>
)

export const StretchIcon = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="12" cy="5" r="2.2" />
    <path d="M12 7.5V13m0 0-3.2 6M12 13l3.2 6M6.5 10.5l5.5-1.8 5.5 1.8" />
  </Svg>
)

export const ResetIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4.5 12a7.5 7.5 0 1 0 2.4-5.5" />
    <path d="M4.5 4.5v4h4" />
  </Svg>
)

export const SkipIcon = (props: IconProps) => (
  <Svg {...props} fill="currentColor" stroke="none">
    <path d="M15 5.5a1 1 0 0 1 2 0v13a1 1 0 0 1-2 0z" />
    <path d="M6.4 6.2a1 1 0 0 1 1.55-.83l7.1 5.8a1 1 0 0 1 0 1.66l-7.1 5.8A1 1 0 0 1 6.4 17.8z" />
  </Svg>
)

export const ExternalIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M14 4h6v6M20 4l-8.5 8.5" />
    <path d="M18 14.5V19a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 19V8a1.5 1.5 0 0 1 1.5-1.5H10" />
  </Svg>
)
