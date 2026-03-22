#!/bin/bash
# Helper script to manage test database Docker container

set -e

COMPOSE_FILE="../../docker-compose.test.yml"
SERVICE_NAME="postgres-test"

case "${1:-}" in
  start)
    echo "Starting test database container..."
    docker compose -f "$COMPOSE_FILE" up -d "$SERVICE_NAME"
    
    echo "Waiting for database to be ready..."
    timeout=30
    counter=0
    while ! docker compose -f "$COMPOSE_FILE" exec -T "$SERVICE_NAME" pg_isready -U postgres -d afenda_test > /dev/null 2>&1; do
      if [ $counter -ge $timeout ]; then
        echo "Error: Database failed to start within ${timeout} seconds"
        docker compose -f "$COMPOSE_FILE" logs "$SERVICE_NAME"
        exit 1
      fi
      sleep 1
      counter=$((counter + 1))
      echo -n "."
    done
    echo ""
    echo "✓ Test database is ready!"
    echo "  Connection string: postgresql://postgres:postgres@localhost:5433/afenda_test"
    ;;
    
  stop)
    echo "Stopping test database container..."
    docker compose -f "$COMPOSE_FILE" stop "$SERVICE_NAME"
    echo "✓ Test database stopped"
    ;;
    
  down)
    echo "Stopping and removing test database container..."
    docker compose -f "$COMPOSE_FILE" down
    echo "✓ Test database container removed"
    ;;
    
  logs)
    docker compose -f "$COMPOSE_FILE" logs -f "$SERVICE_NAME"
    ;;
    
  shell)
    docker compose -f "$COMPOSE_FILE" exec "$SERVICE_NAME" psql -U postgres -d afenda_test
    ;;
    
  reset)
    echo "Resetting test database (removing all data)..."
    docker compose -f "$COMPOSE_FILE" down -v
    docker compose -f "$COMPOSE_FILE" up -d "$SERVICE_NAME"
    
    echo "Waiting for database to be ready..."
    timeout=30
    counter=0
    while ! docker compose -f "$COMPOSE_FILE" exec -T "$SERVICE_NAME" pg_isready -U postgres -d afenda_test > /dev/null 2>&1; do
      if [ $counter -ge $timeout ]; then
        echo "Error: Database failed to start within ${timeout} seconds"
        exit 1
      fi
      sleep 1
      counter=$((counter + 1))
      echo -n "."
    done
    echo ""
    echo "✓ Test database reset and ready!"
    ;;
    
  status)
    if docker compose -f "$COMPOSE_FILE" ps "$SERVICE_NAME" | grep -q "Up"; then
      echo "✓ Test database is running"
      docker compose -f "$COMPOSE_FILE" exec -T "$SERVICE_NAME" pg_isready -U postgres -d afenda_test
    else
      echo "✗ Test database is not running"
      exit 1
    fi
    ;;
    
  *)
    echo "Usage: $0 {start|stop|down|logs|shell|reset|status}"
    echo ""
    echo "Commands:"
    echo "  start   - Start the test database container"
    echo "  stop    - Stop the test database container (keeps data)"
    echo "  down    - Stop and remove the test database container"
    echo "  logs    - Show database logs"
    echo "  shell   - Open psql shell to test database"
    echo "  reset   - Reset database (remove all data and restart)"
    echo "  status  - Check if database is running"
    exit 1
    ;;
esac
