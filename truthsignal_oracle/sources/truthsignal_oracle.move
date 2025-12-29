#[allow(lint(public_entry))]
module truthsignal_oracle::walrus_registry {
    use sui::event;
    use std::string::{Self, String};

    /// Error codes
    const E_NOT_ADMIN: u64 = 1;

    /// Registry that tracks every TruthSignal Walrus upload recorded on-chain.
    public struct TruthSignalRegistry has key {
        id: object::UID,
        admin: address,
        total_entries: u64,
    }

    /// Individual Walrus entry that links an off-chain Walrus CID with metadata.
    public struct WalrusEntry has key, store {
        id: object::UID,
        cid: String,
        snapshot_id: String,
        walrus_url: String,
        digest: String,
        signer: address,
        size_bytes: u64,
        include_audio: bool,
        created_at_ms: u64,
    }

    /// Event emitted whenever a Walrus blob is registered.
    public struct EntryRegistered has copy, drop {
        entry_id: object::ID,
        cid: String,
        snapshot_id: String,
        signer: address,
        digest: String,
        created_at_ms: u64,
    }

    /// One-time initializer. Deployers call this right after publishing the package
    /// to create and share the registry object.
    public entry fun init_registry(ctx: &mut tx_context::TxContext) {
        let registry = TruthSignalRegistry {
            id: object::new(ctx),
            admin: tx_context::sender(ctx),
            total_entries: 0,
        };
        transfer::share_object(registry);
    }

    /// Allows the current admin to rotate control to a new address.
    public entry fun update_admin(
        registry: &mut TruthSignalRegistry,
        new_admin: address,
        ctx: &mut tx_context::TxContext,
    ) {
        assert_admin(registry, ctx);
        registry.admin = new_admin;
    }

    /// Store a Walrus CID + metadata on-chain. Returns the new WalrusEntry object
    /// to the caller so that wallets can reference it directly.
    public entry fun register_entry(
        registry: &mut TruthSignalRegistry,
        cid: vector<u8>,
        snapshot_id: vector<u8>,
        walrus_url: vector<u8>,
        digest: vector<u8>,
        size_bytes: u64,
        include_audio: bool,
        ctx: &mut tx_context::TxContext,
    ) {
        let signer_address = tx_context::sender(ctx);
        let cid_for_entry = copy_bytes(&cid);
        let snapshot_for_entry = copy_bytes(&snapshot_id);
        let url_for_entry = copy_bytes(&walrus_url);
        let digest_for_entry = copy_bytes(&digest);

        let entry = WalrusEntry {
            id: object::new(ctx),
            cid: string::utf8(cid_for_entry),
            snapshot_id: string::utf8(snapshot_for_entry),
            walrus_url: string::utf8(url_for_entry),
            digest: string::utf8(digest_for_entry),
            signer: signer_address,
            size_bytes,
            include_audio,
            created_at_ms: tx_context::epoch_timestamp_ms(ctx),
        };

        let entry_id = object::uid_to_inner(&entry.id);

        registry.total_entries = registry.total_entries + 1;
        let event_cid = string::utf8(cid);
        let event_snapshot = string::utf8(snapshot_id);
        let event_digest = string::utf8(digest);

        event::emit(EntryRegistered {
            entry_id,
            cid: event_cid,
            snapshot_id: event_snapshot,
            signer: signer_address,
            digest: event_digest,
            created_at_ms: entry.created_at_ms,
        });

        transfer::transfer(entry, signer_address);
    }

    /// View helper for total entries stored in the registry.
    public fun total_entries(registry: &TruthSignalRegistry): u64 {
        registry.total_entries
    }

    /// View helper returning the metadata tuple for a WalrusEntry.
    public fun entry_info(entry: &WalrusEntry): (String, String, String, String, address, u64, bool, u64) {
        (
            entry.cid,
            entry.snapshot_id,
            entry.walrus_url,
            entry.digest,
            entry.signer,
            entry.size_bytes,
            entry.include_audio,
            entry.created_at_ms,
        )
    }

    fun assert_admin(registry: &TruthSignalRegistry, ctx: &tx_context::TxContext) {
        assert!(tx_context::sender(ctx) == registry.admin, E_NOT_ADMIN);
    }

    fun copy_bytes(bytes: &vector<u8>): vector<u8> {
        let mut duplicated = vector::empty<u8>();
        let mut i = 0;
        let len = vector::length(bytes);
        while (i < len) {
            let value = *vector::borrow(bytes, i);
            vector::push_back(&mut duplicated, value);
            i = i + 1;
        };
        duplicated
    }
}
