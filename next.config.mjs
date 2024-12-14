
const nextConfig = {
    async rewrites() {
        return [
            {
                source: '/new_age/:path*', // Перехватывает запросы, начинающиеся с /new_age/
                destination: 'https://kwr1337-time-for-namaz-b-7ab2.twc1.net/ :path*', // Проксирует их на ваш API
            },
        ]
    },
};

export default nextConfig;
