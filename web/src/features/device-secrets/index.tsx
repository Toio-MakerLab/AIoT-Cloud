import { IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { Button } from "@/components/ui/button";
import { useDeviceSecretsQuery } from "./api/queries";
import { CreateDeviceSecretDialog } from "./components/create-device-secret-dialog";
import { DeviceSecretsTable } from "./components/device-secrets-table";

export default function DeviceSecrets() {
	const [createOpen, setCreateOpen] = useState(false);
	const { data } = useDeviceSecretsQuery();

	return (
		<>
			<Header fixed>
				<Search />
				<div className="ml-auto flex items-center space-x-4">
					<ThemeSwitch />
					<ProfileDropdown />
				</div>
			</Header>

			<Main>
				<div className="mb-2 flex flex-wrap items-center justify-between space-y-2">
					<div>
						<h2 className="text-2xl font-bold tracking-tight">
							Device Secrets
						</h2>
						<p className="text-muted-foreground">
							Manage the shared secrets device firmware uses to authenticate.
						</p>
					</div>
					<Button onClick={() => setCreateOpen(true)}>
						<IconPlus className="mr-1 h-4 w-4" />
						Create secret
					</Button>
				</div>
				<div className="-mx-4 flex-1 overflow-auto px-4 py-1">
					<DeviceSecretsTable data={data ?? []} />
				</div>
			</Main>

			<CreateDeviceSecretDialog open={createOpen} onOpenChange={setCreateOpen} />
		</>
	);
}
