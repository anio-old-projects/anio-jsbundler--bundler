// todo : make function for collecting resources
// todo : make function for shortening bundle id

import lib from "./project_type_lib/index.mjs"
import copySupportFile from "./copySupportFile.mjs"
import determineFilesForRemoval from "./determineFilesForRemoval.mjs"
import path from "node:path"
import fs from "node:fs/promises"
import calculateBundleID from "./calculateBundleID.mjs"

import {
	isRegularDirectorySync,
	scandirSync
} from "@anio-jsbundler/utilities/fs"

function shortenBundleId(bundle_id) {
	let short_bundle_id = bundle_id.slice(0, 8)

	short_bundle_id += "..."

	short_bundle_id += bundle_id.slice(
		bundle_id.length - 8
	)

	return short_bundle_id
}

export default async function(project) {
	let context = {}

	project.bundle_id = await calculateBundleID(project)
	project.short_bundle_id = shortenBundleId(project.bundle_id)

	if (project.config.type === "lib") {
		project.files_to_autogenerate.push(["util/wrapFactory.mjs", copySupportFile])
		project.files_to_autogenerate.push(["util/createNamedAnonymousFunction.mjs", copySupportFile])

		context = await lib(project)
	}

	project.files_to_remove = [
		...project.files_to_remove,
		...await determineFilesForRemoval(project)
	]

	const bundled_resources_path = path.join(
		project.root, "bundle.resources"
	)

	if (isRegularDirectorySync(bundled_resources_path)) {
		project.bundled_resources = {}

		const entries = scandirSync(bundled_resources_path)

		for (const {type, relative_path, absolute_path} of entries) {
			if (type === "dir") continue

			project.bundled_resources[relative_path] = (await fs.readFile(
				absolute_path
			)).toString()
		}
	}

	return context
}