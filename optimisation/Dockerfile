FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY grid_search.py .
EXPOSE 80
CMD ["python", "grid_search.py"]
