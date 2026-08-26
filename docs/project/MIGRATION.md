# Migration Guide - New Directory Structure

This guide helps you migrate from the old `user-data/` structure to the new Docker best practices layout.

## What Changed

### Old Structure
```
dashhub/
├── user-data/
│   └── conf.yml
└── docker-compose.yml
```

### New Structure (Docker Best Practices)
```
dashhub/
├── config/           # Configuration templates
│   └── default.yml
├── data/             # Persistent runtime data
│   ├── conf.yml
│   ├── known_hosts.json
│   └── uploads/
├── docker/           # Docker-specific files
│   ├── entrypoint.sh
│   └── nginx.conf
├── .env              # Environment variables
├── .env.example      # Environment template
├── .dockerignore     # Build exclusions
├── docker-compose.yml
└── Dockerfile
```

## Migration Steps

### 1. Stop the Container

```bash
docker compose down
```

### 2. Backup Existing Data

```bash
# Backup old configuration
cp -r user-data/ dashhub-backup-$(date +%Y%m%d)/
```

### 3. Move Configuration Files

```bash
# Move configuration to new location
mkdir -p data
mv user-data/conf.yml data/conf.yml

# Move any credentials file
mv user-data/credentials.enc data/credentials.enc 2>/dev/null || true
```

### 4. Setup Environment

```bash
# Copy environment template
cp .env.example .env

# Edit if needed (defaults work for most cases)
nano .env
```

### 5. Update docker-compose.yml

The new `docker-compose.yml` uses:
- `./data:/app/data` volume mount (instead of `./user-data:/app/user-data`)
- Environment variables from `.env` file
- Health checks and logging configuration

### 6. Rebuild and Start

```bash
docker compose up -d --build
```

### 7. Verify

```bash
# Check container status
docker ps | grep dashhub

# Check logs
docker compose logs dashhub

# Access dashboard
open http://localhost:48215
```

## Rollback (If Needed)

If you need to rollback to the old structure:

```bash
# Stop container
docker compose down

# Move data back
rm -rf user-data
mv data user-data

# Restore old docker-compose.yml (from backup)
# cp backup-docker-compose.yml docker-compose.yml

# Start with old configuration
docker compose up -d
```

## Benefits of New Structure

| Aspect | Old | New |
|--------|-----|-----|
| **Config/Data Separation** | Mixed in `user-data/` | Separate `config/` and `data/` |
| **Environment Variables** | Hardcoded in compose | `.env` file |
| **Docker Files** | Scattered | Organized in `docker/` |
| **Build Context** | Included everything | `.dockerignore` excludes unnecessary files |
| **Documentation** | Minimal | `STRUCTURE.md` with full details |
| **Best Practices** | Basic | Follows Docker recommendations |

## Post-Migration Checklist

- [ ] Configuration loads correctly
- [ ] SSH credentials work (if using)
- [ ] Widgets display properly
- [ ] Settings save to `data/conf.yml`
- [ ] Backup `data/` directory
- [ ] Update any scripts referencing old paths
- [ ] Update CI/CD pipelines if applicable

## Troubleshooting

### Configuration Not Loading

```bash
# Check if file exists
ls -la data/conf.yml

# Check permissions
chmod 644 data/conf.yml

# Restart container
docker compose restart
```

### Container Won't Start

```bash
# Check logs
docker compose logs

# Verify .env file exists
ls -la .env

# Check volume mounts
docker compose config
```

### Data Lost

If `data/conf.yml` is missing, it will be recreated from `config/default.yml` on first run.

To restore from backup:
```bash
cp backup/conf.yml data/conf.yml
docker compose restart
```

## Need Help?

- See [STRUCTURE.md](./STRUCTURE.md) for detailed documentation
- Check [docs/deployment.md](./docs/deployment.md) for setup guide
- Review container logs: `docker compose logs`
