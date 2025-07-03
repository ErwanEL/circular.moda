/** @type {import('next').NextConfig} */import withFlowbiteReact from "flowbite-react/plugin/nextjs";

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'v5.airtableusercontent.com',
      },
    ],
  },
};

export default withFlowbiteReact(nextConfig);