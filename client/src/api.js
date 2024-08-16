import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:5002",
    //baseURL: "http://192.168.0.13:5002",
    timeout: 1000 * 30,
    headers: {
        "X-Requested-With": "XMLHttpRequest",
    },
    withCredentials: true,
});

// Добавляем интерсептор ответа
api.interceptors.response.use(
    (response) => {
        // Если запрос выполнен успешно, просто возвращаем ответ
        return response;
    },
    (error) => {
        // Проверяем, была ли ошибка аутентификации
        if (error.response && error.response.status === 401) {
            // В случае ошибки аутентификации можно выполнить обновление токена
            console.log("Токен истек. Попытка обновить...");

            return api
                .post("/refresh", {}, { withCredentials: true })
                .then((res) => {
                    console.log("Токен успешно обновлен");

                    // Обновляем токен в заголовке
                    const accessToken = res.data.accessToken;
                    localStorage.setItem("token", accessToken);
                    api.defaults.headers.common[
                        "Authorization"
                    ] = `Bearer ${accessToken}`;

                    // Повторяем исходный запрос с новым токеном
                    error.config.headers[
                        "Authorization"
                    ] = `Bearer ${accessToken}`;
                    return api.request(error.config);
                })
                .catch((refreshError) => {
                    console.log("Не удалось обновить токен:", refreshError);
                    return Promise.reject(refreshError); // Если обновить не удалось, отклоняем промис
                });
        }

        // Для всех остальных ошибок просто возвращаем Promise.reject
        return Promise.reject(error);
    }
);

api.interceptors.request.use((config) => {
    config.headers.Authorization = window.localStorage.getItem("token");
    return config;
});

export default api;
