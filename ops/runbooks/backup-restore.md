# Backup & restore

## What we back up

| What | Where | Cadence | Retention |
|---|---|---|---|
| Postgres (all service DBs) | Hetzner Storage Box (S3-compatible) | WAL continuous + nightly logical | 30 days hot, 1 year cold |
| MinIO buckets (documents, audit archive) | Storage Box | Server-side replication | indefinite |
| ArgoCD `app.yaml` definitions | Git | always | history of `main` |
| Cluster secrets (Sealed Secrets) | Git (encrypted) | always | history of `main` |
| Cluster state | etcd snapshot on k3s | hourly | 7 days |

WAL streaming and base backups are managed by **CloudNativePG**, configured in
`infra/k3s/helm/vettguard/postgres-cluster.yaml` (Phase 2 deliverable).

## Restore Postgres (single service DB)

```bash
export KUBECONFIG=~/.kube/vettguard-production.kubeconfig

# 1. Identify the target time. CNPG stores backups as Barman backups.
kubectl get backups -n vettguard

# 2. Create a new Cluster resource pointing to the backup for PITR
cat <<EOF | kubectl apply -f -
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: identity-restore-$(date +%Y%m%d-%H%M)
  namespace: vettguard
spec:
  instances: 1
  bootstrap:
    recovery:
      source: identity-pg
      recoveryTarget:
        targetTime: "2026-05-15 14:30:00.00+00"
  externalClusters:
    - name: identity-pg
      barmanObjectStore:
        destinationPath: s3://vettguard-pg-backups
        endpointURL: https://fsn1.your-objectstorage.com
        s3Credentials:
          accessKeyId: { name: storage-box-creds, key: id }
          secretAccessKey: { name: storage-box-creds, key: secret }
EOF

# 3. Wait for it to come ready
kubectl wait --for=condition=Ready cluster/identity-restore-... -n vettguard --timeout=15m

# 4. Smoke test
kubectl exec -n vettguard identity-restore-...-1 -- psql -U postgres -c '\dt'

# 5. If healthy, cut over: update identity service config to point to new cluster
#    DATABASE_URL, then drop the old one after 24h.
```

## Restore MinIO bucket

```bash
mc alias set hot   https://minio.vettguard.com $MINIO_KEY $MINIO_SECRET
mc alias set cold  https://fsn1.your-objectstorage.com $SB_KEY $SB_SECRET
mc mirror --overwrite cold/vettguard-docs-archive/2026-05-15/ hot/vettguard-docs/
```

## Restore drill — quarterly

Goals: prove backups are valid + measure RTO.

1. Schedule via on-call calendar
2. Pick one service DB at random
3. Restore to scratch cluster, verify row counts match within 0.01%
4. Document RTO + any pain points in `docs/security/restore-drill-YYYYQX.md`
5. File any tooling gaps as issues

Target: full PITR restore in < 30 minutes.

## Verify backups exist (daily smoke)

```bash
kubectl get backups -n vettguard -o json | jq '.items[].status.phase' | sort | uniq -c
# Expect: all "completed", none "failed" in the last 24h
```

If any failed: page on-call. See `incident-response.md`.
