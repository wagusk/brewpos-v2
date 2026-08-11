import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { CssBaseline } from '@mui/material';

import { store } from './core/store';
import { MonoThemeProvider } from './core/theme/monoTheme';
import { App } from './app/App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <CssBaseline />
      <MonoThemeProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </MonoThemeProvider>
    </Provider>
  </React.StrictMode>,
);
