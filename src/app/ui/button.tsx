'use client';

import Link from 'next/link';
import type { AnchorHTMLAttributes } from 'react';
import { getButtonClasses } from './button-classes';
import type { ButtonStyleProps } from './button-classes';

export type ButtonProps = {
  text: React.ReactNode;
  link?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  target?: string;
  rel?: string;
} & ButtonStyleProps &
  Omit<React.ComponentPropsWithoutRef<'button'>, 'children'>;

export default function Button({
  text,
  link,
  startIcon,
  endIcon,
  variant = 'primary',
  size = 'md',
  solid = false,
  bold = false,
  className = '',
  target,
  rel,
  type = 'button',
  ...rest
}: ButtonProps) {
  const classes = getButtonClasses({
    variant,
    size,
    solid,
    bold,
    className,
  });

  const content = (
    <>
      {startIcon}
      {text}
      {endIcon}
    </>
  );

  const {
    disabled: _d,
    form: _form,
    formAction: _fa,
    formEncType: _fe,
    formMethod: _fm,
    formNoValidate: _fn,
    formTarget: _ft,
    name: _n,
    value: _v,
    type: _t,
    ...linkableRest
  } = rest as Record<string, unknown>;

  if (link) {
    if (link.startsWith('/')) {
      return (
        <Link href={link} className={classes} {...(linkableRest as object)}>
          {content}
        </Link>
      );
    }

    const isHttp = /^https?:\/\//i.test(link);
    const defaultTarget =
      target ?? (isHttp ? ('_blank' as const) : undefined);
    const defaultRel =
      rel ?? (isHttp ? 'noopener noreferrer' : undefined);

    return (
      <a
        href={link}
        className={classes}
        target={defaultTarget}
        rel={defaultRel}
        {...(linkableRest as Omit<
          AnchorHTMLAttributes<HTMLAnchorElement>,
          'href' | 'className' | 'children'
        >)}
      >
        {content}
      </a>
    );
  }

  return (
    <button type={type} className={classes} {...rest}>
      {content}
    </button>
  );
}
