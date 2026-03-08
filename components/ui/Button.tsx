import type { Route } from 'next';
import Link from 'next/link';
import { type ButtonHTMLAttributes, type ReactNode } from 'react';

type CommonProps = {
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
  size?: 'normal' | 'stor';
  variant?: 'primary' | 'secondary' | 'ghost';
};

type LinkButtonProps = CommonProps & {
  href: Route;
};

type NativeButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & {
    href?: never;
  };

type Props = LinkButtonProps | NativeButtonProps;

function isLinkButtonProps(props: Props): props is LinkButtonProps {
  return 'href' in props && props.href !== undefined;
}

function getButtonClassName({
  className,
  fullWidth = false,
  size = 'normal',
  variant = 'primary',
}: CommonProps): string {
  return [
    'button',
    `button${variant[0].toUpperCase()}${variant.slice(1)}`,
    size === 'stor' ? 'buttonLarge' : '',
    fullWidth ? 'buttonFull' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');
}

export default function Button(props: Props) {
  const className = getButtonClassName(props);

  if (isLinkButtonProps(props)) {
    return (
      <Link className={className} href={props.href}>
        {props.children}
      </Link>
    );
  }

  const { children, fullWidth, size, variant, className: customClassName, ...buttonProps } = props;

  return (
    <button className={className} {...buttonProps}>
      {children}
    </button>
  );
}
