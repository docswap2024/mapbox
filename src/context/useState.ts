import {useContext} from 'react';
import {Context} from './state';

export function useCustomContext() {
  const context = useContext(Context);

  if (!context) {
    throw new Error('CustomContext must be used within a ContextProvider');
  }
  return context;
}
