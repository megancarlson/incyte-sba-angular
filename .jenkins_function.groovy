// Useful Jenkins functions

// call a job to build an app
def build_app(sba_version, jobToBuild, branch) {
	stage("Build app ${jobToBuild}") {
		// is the job runnable ?
		def enabled = Jenkins.instance.getItemByFullName(jobToBuild).isBuildable();
		def jobnamebranch = "${jobToBuild}/${branch}"
		echo "build app ${jobToBuild} in branch ${branch} with sba-internal version ${sba_version} ${jobnamebranch}"
		if (enabled) {
			// start the job (without propagate error)
			def resbuild = build job: jobnamebranch, wait: true, propagate: false, parameters: [string(name: 'SBA_VERSION', value: sba_version)]
			def jobResult = resbuild.getResult()
			echo "Build of ${jobnamebranch} returned result: ${jobResult}"
			if (jobResult != 'SUCCESS') {
				sendMessage("#CC0000", "Build failed when building ${jobToBuild} in branch ${branch} with sba-internal version ${sba_version}")
				// set the current build as unstable (warning)
				currentBuild.result = "UNSTABLE"
			}
		}
	}
}

// function to get the package version in package.json file
def get_pkg_version() {
	def pkg_version = powershell(returnStdout: true, script: '''
		$file = 'package.json'
		$search = '.+"version":\\s"(.+)"'
		$retval = (Select-String -path $file -pattern $search -Allmatches | % { $_.Matches.Groups[1].Value })
		write-output $retval
	''')
	// remove CR/LF
	pkg_version = pkg_version.trim()
	pkg_version = "${pkg_version}${pkg_suffix}.${env.BUILD_NUMBER}"
	echo "pkg_version: ${pkg_version}"
	return pkg_version
}

// function to check if we are in PR or another branch
def buildOrMerge() {
	def typeAction = ""
	if (env.BRANCH_NAME.contains("PR-")) {
		typeAction = "build"
	} else {
		typeAction = "merge"
	}
	return typeAction
}

// get the branch name and the version number from the right jenkins variable 
def findBranchNumber() {
	def tmpBranch=""
	def theBranch=""
	// PR : 
	//   BRANCH_NAME: PR-8208
	//   CHANGE_TARGET: release/11.7.0
	// BRANCH
	//   BRANCH_NAME: develop
	//   BRANCH_NAME: release/11.7.0
	// return: release%2F11.7.0

	echo "Triggering job for branch ${env.BRANCH_NAME}"
	if (env.BRANCH_NAME.contains("PR-")) {
		tmpBranch = env.CHANGE_TARGET
	} else {
		tmpBranch = env.BRANCH_NAME
	}
	echo "tmpBranch: ${tmpBranch}"

	theBranch = tmpBranch.replace("/", "%2F")
	echo "Branch returned: ${theBranch}"
	return theBranch
}

// function to append lines to the end of a file
def appendFile(afile, what) {
	def content = ""
	def txt = ""
	try {
		if (fileExists(afile)) {
			content = readFile afile
			what.each {
				txt += it + "\n"
			}
			content += txt
			//echo "content: ${content}"
			writeFile file: afile, text: content
		}
	} catch (err) {
		currentBuild.result = "FAILURE"
		throw err
	}
}

// function to send an email to the authors of the commit
def sendMessage(color, specificMessage, logfile="") {
	echo "Message is: ${specificMessage}"
	if (!binding.hasVariable("AUTHOR_NAME")) {
		AUTHOR_NAME = ""
	}
	// https://jenkins.sinequa.com/env-vars.html/

	to = ""
	pbranch = env.BRANCH_NAME
	branch_link = pbranch
	if (pbranch.startsWith("PR-")) {
		branch_link += " https://github.sinequa.com/Product/ice/pull/" + pbranch.replace("PR-", "")
	}
	if ("${color}" == "#26cc00") {
		status = "OK"
	} else {
		status = "Failed"
		to = mailto
	}
	if ("${AUTHOR_NAME}" != "") {
		to = "${AUTHOR_NAME}" + ", " + to
	}
	// println("mailTo: ${to}")
	
	subject = "[${pbranch}] ${BUILD_TAG} ${status}"
	echo "Send email ${subject} to ${to}"
	
	header = "Commit on branch ${branch_link} from ${AUTHOR_NAME}\nJob ${BUILD_URL}/\n"
	message = "${header}\n${specificMessage}"
	
	if ("${status}" == "Failed" && logfile?.trim()) {
		log = bat (script: "type ${WORKSPACE}\\${logfile}",returnStdout: true)
		emailext(from: "build@sinequa.com",  to: "${to}", attachLog:true, subject: "${subject}", body: "${message}\n\n${log}")
	} else {
		emailext(from: "build@sinequa.com",  to: "${to}", attachLog:false, subject: "${subject}", body: "${message}\n\n")
	}
}
return this