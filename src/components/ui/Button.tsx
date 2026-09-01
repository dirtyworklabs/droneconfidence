import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'onDark'
export type ButtonSize = 'compact' | 'md' | 'lg'

interface CommonProps {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  /** Shows a trailing arrow that nudges on hover. */
  withArrow?: boolean
  /** Renders the external-link arrow and adds a screen-reader hint. */
  external?: boolean
  fullWidth?: boolean
}

const base =
  'group/btn inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] font-display font-semibold tracking-[-0.01em] transition-[transform,background-color,border-color,box-shadow,color] duration-200 ease-[var(--ease-calm)] disabled:cursor-not-allowed disabled:opacity-60'

const sizes: Record<ButtonSize, string> = {
  // Header CTA. Never wraps, never shrinks, and holds a 40px+ target even at
  // 360px, stepping up to the standard control size from 640px.
  compact:
    'whitespace-nowrap min-h-10 px-3 text-[0.8rem] min-[400px]:px-3.5 min-[400px]:text-[0.85rem] sm:min-h-11 sm:px-5 sm:py-2.5 sm:text-[0.95rem]',
  md: 'min-h-11 px-5 py-2.5 text-[0.95rem]',
  lg: 'min-h-13 px-6 py-3.5 text-[1.02rem]',
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-eucalyptus text-canvas shadow-[var(--shadow-raise)] hover:-translate-y-px hover:bg-eucalyptus-deep hover:shadow-[var(--shadow-lift)] active:translate-y-0',
  secondary:
    'border border-ink/12 bg-surface text-ink hover:-translate-y-px hover:border-ink/20 hover:bg-white hover:shadow-[var(--shadow-raise)] active:translate-y-0',
  quiet:
    'px-0 text-sage underline decoration-sage/30 decoration-1 underline-offset-[6px] hover:text-eucalyptus hover:decoration-eucalyptus/50',
  onDark:
    'bg-canvas text-eucalyptus-deep hover:-translate-y-px hover:bg-white hover:shadow-[var(--shadow-lift)] active:translate-y-0',
}

const Inner = ({ children, withArrow, external }: Pick<CommonProps, 'children' | 'withArrow' | 'external'>) => (
  <>
    <span>{children}</span>
    {external ? (
      <ArrowUpRight
        aria-hidden="true"
        className="size-4 shrink-0 transition-transform duration-200 ease-[var(--ease-calm)] group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5"
      />
    ) : withArrow ? (
      <ArrowRight
        aria-hidden="true"
        className="size-4 shrink-0 transition-transform duration-200 ease-[var(--ease-calm)] group-hover/btn:translate-x-1"
      />
    ) : null}
    {external ? <span className="sr-only"> (opens the booking page)</span> : null}
  </>
)

const classesFor = ({ variant = 'primary', size = 'md', fullWidth, className }: CommonProps) =>
  cn(base, sizes[size], variants[variant], fullWidth && 'w-full', className)

type LinkButtonProps = CommonProps & { to: string; onClick?: () => void }

export const LinkButton = ({ to, onClick, ...rest }: LinkButtonProps) => (
  <Link to={to} onClick={onClick} className={classesFor(rest)}>
    <Inner {...rest} />
  </Link>
)

type AnchorButtonProps = CommonProps & {
  href: string
  newTab?: boolean
  onClick?: () => void
}

export const AnchorButton = ({ href, newTab, onClick, ...rest }: AnchorButtonProps) => (
  <a
    href={href}
    onClick={onClick}
    {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    className={classesFor(rest)}
  >
    <Inner {...rest} />
  </a>
)

type ActionButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>

export const Button = ({ type = 'button', ...rest }: ActionButtonProps) => {
  const { children, variant, size, className, withArrow, external, fullWidth, ...buttonProps } = rest
  return (
    <button
      type={type}
      {...buttonProps}
      className={classesFor({ children, variant, size, className, withArrow, external, fullWidth })}
    >
      <Inner children={children} withArrow={withArrow} external={external} />
    </button>
  )
}
