import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /* Only the two places site images live may be optimised: uploads, and the
       placeholder covers the seed uses until real ones are uploaded. No query
       strings, so nobody can use the optimiser to resize arbitrary URLs. */
    localPatterns: [
      { pathname: "/uploads/**", search: "" },
      { pathname: "/placeholders/**", search: "" },
    ],
  },
  experimental: {
    /* proxy.ts runs on /api/admin, and Next.js buffers a request body there
       up to this size. An image may be 10MB; the multipart envelope around it
       needs a little more, or the upload arrives cut short. D-072. */
    proxyClientMaxBodySize: "11mb",
  },
};

export default nextConfig;
