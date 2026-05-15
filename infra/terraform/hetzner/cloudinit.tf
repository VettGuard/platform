# Cloud-init bootstrap script — runs once when a node first boots.
# Installs base packages, hardens SSH, prepares disk for k3s.
# k3s itself is installed by scripts/install-k3s.sh after `terraform apply`
# (cleaner separation than embedding k3s install in cloud-init).
locals {
  cloudinit = <<-CLOUD
    #cloud-config
    package_update: true
    package_upgrade: false
    packages:
      - curl
      - jq
      - ufw
      - fail2ban
      - unattended-upgrades
      - apt-listchanges
      - htop
      - net-tools
    write_files:
      - path: /etc/ssh/sshd_config.d/99-vettguard.conf
        permissions: "0644"
        content: |
          PasswordAuthentication no
          PermitRootLogin prohibit-password
          ClientAliveInterval 60
          ClientAliveCountMax 3
      - path: /etc/sysctl.d/99-k3s.conf
        permissions: "0644"
        content: |
          net.bridge.bridge-nf-call-iptables = 1
          net.bridge.bridge-nf-call-ip6tables = 1
          net.ipv4.ip_forward = 1
          fs.inotify.max_user_instances = 8192
          fs.inotify.max_user_watches = 524288
      - path: /etc/apt/apt.conf.d/50unattended-upgrades-vettguard
        permissions: "0644"
        content: |
          Unattended-Upgrade::Origins-Pattern {
            "origin=Ubuntu,archive=$${distro_codename}-security";
          };
          Unattended-Upgrade::Automatic-Reboot "false";
    runcmd:
      - sysctl --system
      - systemctl restart ssh
      - ufw --force enable
      - ufw allow 22,80,443,6443/tcp
      - ufw allow from 10.0.0.0/16
      - systemctl enable --now fail2ban
      - systemctl enable --now unattended-upgrades
  CLOUD
}
