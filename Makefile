build:
	docker build -t omni-js .

run:
	docker run -d --restart unless-stopped -p 32768:3434 --env-file .env --name omni-js omni-js

clean:
	docker system prune -af --volumes
