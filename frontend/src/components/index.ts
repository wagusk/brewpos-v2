/**
 * Component index — all design system components exported here.
 *
 * This centralizes all POS components so they can be imported from a single entry:
 *   import { POSCard, POSButton, POSChip } from '@/components'
 */

export { default as POSCard } from './POSCard';
export type { POSCardProps } from './POSCard';

export { default as POSButton } from './POSButton';
export type { POSButtonProps } from './POSButton';

export { default as POSTextField } from './POSTextField';
export type { POSTextFieldProps } from './POSTextField';

export { default as POSSelect } from './POSSelect';
export type { POSSelectProps, POSSelectOption } from './POSSelect';

export { default as POSChip } from './POSChip';
export type { POSChipProps } from './POSChip';

export { default as POSIcon } from './POSIcon';
export type { POSIconProps } from './POSIcon';

export { default as Shell } from './Shell';
