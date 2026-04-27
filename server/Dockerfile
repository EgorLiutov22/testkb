FROM python:3.10-slim
WORKDIR /server
COPY . /server
RUN pip install --no-cache-dir -r server/requirements.txt
EXPOSE 80
CMD ["python", "flask run --host=0.0.0.0"]
