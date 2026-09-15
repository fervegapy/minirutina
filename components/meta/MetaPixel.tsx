import { Suspense } from "react";
import { META_PIXEL_ID } from "@/lib/meta-pixel";
import MetaPageView from "./MetaPageView";

/**
 * Meta Pixel base code. Rendered as a plain inline <script> (not next/script
 * afterInteractive) so the `fbq` queue exists before React hydrates — events
 * fired from the first page's effects (e.g. ViewContent when landing straight
 * from an ad) get queued instead of dropped.
 * The initial PageView is sent here; <MetaPageView /> covers client-side
 * navigations. Admin routes are not tracked.
 */
export default function MetaPixel() {
  if (!META_PIXEL_ID) return null;
  const snippet = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${META_PIXEL_ID}');
if(!location.pathname.startsWith('/admin'))fbq('track','PageView');`;
  return (
    <>
      <script id="meta-pixel" dangerouslySetInnerHTML={{ __html: snippet }} />
      {/* Inner HTML as a string: with JSX children React would build a real
          <img> on the client and send a duplicate PageView. */}
      <noscript
        dangerouslySetInnerHTML={{
          __html: `<img height="1" width="1" style="display:none" alt="" src="https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1" />`,
        }}
      />
      <Suspense fallback={null}>
        <MetaPageView />
      </Suspense>
    </>
  );
}
