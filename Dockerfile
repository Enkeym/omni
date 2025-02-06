# Используем lightweight-образ Node.js
FROM node:18-alpine AS builder

# Устанавливаем рабочую директорию внутри контейнера
WORKDIR /app

# Копируем package.json и yarn.lock (только их, чтобы использовать кеширование слоев)
COPY package.json yarn.lock ./

# Устанавливаем зависимости, включая devDependencies
RUN yarn install --frozen-lockfile

# Копируем исходный код
COPY . .

# Удаляем devDependencies, чтобы минимизировать образ
RUN yarn install --production && yarn cache clean

# Создаем минимальный образ для продакшена
FROM node:18-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем только необходимые файлы из builder-образа
COPY --from=builder /app /app

# Открываем порт 3434
EXPOSE 3434

# Запуск приложения
CMD ["yarn", "start"]
