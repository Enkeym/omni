build:
	docker build -t omni .

run:
	docker run -d --restart unless-stopped -p 32768:3434 --env-file .env --name omni omni

clean:
	docker system prune -af --volumes
