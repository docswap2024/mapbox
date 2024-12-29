import '../src/app/globals.css'
import { PrintProvider } from '@/context/printContext';


export default function App({ Component, pageProps }) {
  return (
      <>
        <PrintProvider>
          <Component {...pageProps} />
        </PrintProvider>
      </>
      
  )
} 