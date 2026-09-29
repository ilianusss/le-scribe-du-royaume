import type { PressableStateCallbackType } from 'react-native';

export type PressState = PressableStateCallbackType & { focused?: boolean; hovered?: boolean };
