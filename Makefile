build:
	docker build -t omni .

run:
	docker run -d --restart unless-stopped -p 3434:3434 --env-file .env --name omni omni

clean:
	docker system prune -af --volumes

stop:
	docker stop omni
	docker rm omni

rebuild: stop clean build run
