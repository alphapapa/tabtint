# * Variables

TOP = $(shell pwd)
BUILD_DIR := $(TOP)/build

XPI_NAME = $(NAME)-$(VERSION)
XPI_FILE =  $(XPI_NAME).xpi
XPI_PATH = $(BUILD_DIR)/$(XPI:%.xpi=%)

XPI_FILES := chrome defaults META-INF chrome.manifest install.rdf

# * Rules

TARGETS = clean xpi

.PHONY: $(TARGETS)

clean:
	rm -rf $(BUILD_DIR)

xpi: $(FILES)
	@echo "Building XPI..."

	# Delete and recreate build directories
	rm -rfv "$(XPI_PATH)"
	mkdir -p "$(XPI_PATH)"

	# Copy files to archive directory
	cp -a $(XPI_FILES) "$(XPI_PATH)"

	# Build archive
	cd "$(XPI_PATH)" && zip --no-dir-entries -9r "$(BUILD_DIR)"/"$(XPI_FILE)" *

	echo "Built XPI: $(BUILD_DIR)/$(XPI_FILE)"
