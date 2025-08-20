const nextConfig = {
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'https://kwr1337-time-for-namaz-b-7ab2.twc1.net/api/:path*',
            },
        ]
    },
};

export default nextConfig;
